import { z } from "zod";
import { chunkText } from "@sps/knowledge/backend/app/api/src/lib/indexer/chunker";
import type { IModel } from "@sps/agent/models/work-attempt/sdk/model";
import type { Service as WorkAttempt } from "./index";
import type { IWorkStep } from "./operations";

const channelSlug = "agent-knowledge-maintenance";
const dimensions = 768;

export const maintenanceScope = z
  .object({ storeId: z.uuid(), taskId: z.uuid() })
  .strict();
const deliverySchema = maintenanceScope.extend({
  ownerId: z.uuid(),
  eventId: z.uuid(),
  sourceId: z.uuid(),
  sourceHash: z.string().length(64),
  publicationId: z.uuid(),
  assigneeId: z.uuid(),
  assignmentRevision: z.number().int().positive(),
});
type TScope = z.infer<typeof maintenanceScope>;
export type TMaintenanceDelivery = z.infer<typeof deliverySchema>;

const where = (values: Record<string, string>) => ({
  params: {
    filters: {
      and: Object.entries(values).map(([column, value]) => ({
        column,
        value,
        method: "eq" as const,
      })),
    },
  },
});

export class Maintenance {
  constructor(private readonly worker: WorkAttempt) {}

  private async channel() {
    const { channel } = this.worker.modules.broadcast;
    return this.worker.repository.atomic(channelSlug, async () => {
      const [existing] = await channel.find(where({ slug: channelSlug }));
      if (existing) {
        return existing;
      }
      return channel.create({
        data: { slug: channelSlug, title: "Store knowledge maintenance" },
      });
    });
  }

  async authorize(actorId: string, scope: TScope) {
    const { crm, rbac, knowledge, social } = this.worker.modules;
    const grants =
      await rbac.subject.module.subjectsToEcommerceModuleStores.find(
        where({
          subjectId: actorId,
          ecommerceModuleStoreId: scope.storeId,
          variant: "owner",
        }),
      );
    if (!grants.length) {
      throw new Error(
        "Permission error. Maintaining the index requires store ownership",
      );
    }
    const task = await crm.task.get(scope);
    const publication = await crm.task.getPublication(scope);
    const sourceId = publication.definition.maintenanceSourceId;
    if (
      !sourceId ||
      !task.assigneeId ||
      task.assigneeKind !== "ai" ||
      task.customerId !== actorId ||
      task.orderId ||
      publication.definition.workFunding?.payer !== "store-owner"
    ) {
      throw new Error(
        "Permission error. Use a separate store-owner-funded maintenance task",
      );
    }
    const expert = await rbac.subject.customerWork.expertForMaintenance(task);
    if (!expert) {
      throw new Error(
        "Not Found error. The maintenance task must have one store expert",
      );
    }
    const links = await social.profilesToKnowledgeModuleSources.find(
      where({
        profileId: expert,
        knowledgeModuleSourceId: sourceId,
        storeId: scope.storeId,
        variant: "default",
      }),
    );
    if (!links.some((link) => !link.projectId)) {
      throw new Error(
        "Not Found error. This source is unavailable for store maintenance",
      );
    }
    const [source] = await knowledge.source.findSourcesByIds([sourceId]);
    if (!source || source.variant === "customer-memory") {
      throw new Error(
        "Not Found error. This source is unavailable for store maintenance",
      );
    }
    const opening = await crm.taskEvent.byOperation(task.id, task.openingKey);
    if (opening?.kind !== "opened" || opening.actorId !== actorId) {
      throw new Error(
        "Permission error. The maintenance task was opened by a different actor",
      );
    }
    return { task, source, eventId: opening.id };
  }

  async queue(actorId: string, scope: TScope) {
    const { task, source, eventId } = await this.authorize(actorId, scope);
    const channel = await this.channel();
    const payload = deliverySchema.parse({
      ...scope,
      ownerId: actorId,
      eventId,
      sourceId: source.id,
      sourceHash: source.contentHash,
      publicationId: task.publicationId,
      assigneeId: task.assigneeId,
      assignmentRevision: task.assignmentRevision,
    });
    await this.worker.modules.broadcast.channel.queue.publish({
      channelId: channel.id,
      key: `knowledge-maintenance:${eventId}`,
      payload: JSON.stringify(payload),
    });
    return { taskId: task.id, eventId };
  }

  async drain(
    perform: (
      delivery: TMaintenanceDelivery,
      step: IWorkStep,
    ) => Promise<IModel>,
    limit: number,
  ) {
    const channel = await this.channel();
    const queue = this.worker.modules.broadcast.channel.queue;
    const jobs = await queue.reserve({
      channelId: channel.id,
      concurrency: limit,
      leaseSeconds: 180,
    });
    for (const job of jobs) {
      if (!(await queue.start(job))) {
        continue;
      }
      try {
        const data = deliverySchema.parse(JSON.parse(job.payload));
        if (job.key !== `knowledge-maintenance:${data.eventId}`) {
          throw new Error(
            "Validation error. The maintenance job does not match its event",
          );
        }
        const { source, task } = await this.authorize(data.ownerId, data);
        if (
          source.id !== data.sourceId ||
          source.contentHash !== data.sourceHash ||
          task.publicationId !== data.publicationId ||
          task.assigneeId !== data.assigneeId ||
          task.assignmentRevision !== data.assignmentRevision
        ) {
          await queue.acknowledge(job);
          continue;
        }
        const chunks = chunkText({ text: source.content });
        if (!chunks.length || chunks.length > 12) {
          throw new Error(
            "Validation error. A paid maintenance run accepts between 1 and 12 text chunks",
          );
        }
        const attempt = await perform(data, {
          operation: "knowledge-index",
          input: {
            capability: "embedding",
            dimensions,
            sourceIds: [source.id],
            inputs: chunks.map(({ text }) => text),
            indexing: {
              sourceId: source.id,
              contentHash: data.sourceHash,
              ownerId: data.ownerId,
            },
          },
        });
        if (["delivered", "failed", "stale"].includes(attempt.state)) {
          await queue.acknowledge(job);
        } else {
          await queue.release(job);
        }
      } catch (error) {
        if (
          error instanceof z.ZodError ||
          (error instanceof Error &&
            /^(Permission|Not Found|Conflict|Validation) error\./.test(
              error.message,
            ))
        ) {
          await queue.acknowledge(job);
        } else {
          await queue.release(job);
        }
      }
    }
  }

  async publish(projection: IModel) {
    const index = projection.result?.indexing;
    const vectors = projection.result?.embeddings;
    if (
      !index ||
      !vectors ||
      vectors.dimensions !== dimensions ||
      vectors.model !== projection.model
    ) {
      return false;
    }
    const { crm, knowledge } = this.worker.modules;
    return crm.task.withWork(
      {
        storeId: projection.storeId,
        taskId: projection.taskId,
        assigneeId: projection.assigneeId,
        expectedAssignmentRevision: projection.assignmentRevision,
      },
      async ({ task }) => {
        const { source } = await this.authorize(projection.ownerId, {
          storeId: task.storeId,
          taskId: task.id,
        });
        if (
          task.publicationId !== projection.publicationId ||
          task.stageId !== projection.stageId ||
          source.id !== index.sourceId ||
          source.contentHash !== index.contentHash
        ) {
          return false;
        }
        const chunks = chunkText({ text: source.content });
        if (chunks.length !== vectors.values.length) {
          return false;
        }
        return knowledge.source.publishChunks(
          source.id,
          source.contentHash,
          chunks.map((chunk, indexNumber) => ({
            ...chunk,
            embedding: vectors.values[indexNumber],
            metadata: { ...chunk.metadata, embeddingIndex: index.indexKey },
          })),
        );
      },
    );
  }
}

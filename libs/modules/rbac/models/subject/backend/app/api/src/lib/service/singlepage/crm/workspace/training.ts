import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { getHttpErrorType } from "@sps/backend-utils";
import { z } from "zod";
import {
  isStoreEmployeeTraining,
  STORE_EMPLOYEE_TRAINING_KEY_PREFIX,
  type IModel as ITask,
} from "@sps/crm/models/task/sdk/model";
import type { IModel as IChat } from "@sps/social/models/chat/sdk/model";
import { withSocialMessageSystemMetadata } from "@sps/social/models/message/sdk/model";
import {
  PROVIDER_MODEL_SELECTION_METADATA_KEY,
  providerModelSelection,
  type IProviderModelSelection,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import type { Service as Subject } from "../../index";
import { criteria } from "../../ecommerce/customer-work/utils";
import type { IStoreEmployeeTrainingScope } from "./employees";

interface ITrainingMessage {
  actorId: string;
  actorProfileId: string;
  chat: IChat;
  threadId: string;
  text: unknown;
  sourceSystemId?: string;
  selection?: IProviderModelSelection;
  hasAttachments: boolean;
}

function openingKey(threadId: string, publicationId: string) {
  return `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}${threadId}:${publicationId}`;
}

export function employeeTrainingThreadId(
  task: Pick<ITask, "openingKey" | "publicationId">,
) {
  const [id] = task.openingKey
    .slice(STORE_EMPLOYEE_TRAINING_KEY_PREFIX.length)
    .split(":");
  if (task.openingKey === openingKey(id, task.publicationId)) {
    return z.uuid().safeParse(id).data;
  }
  return undefined;
}

export class EmployeeTrainingBudgetUnavailable extends Error {
  constructor() {
    super("Payment required. The employee training budget changed");
  }
}

export class Service {
  constructor(
    private readonly subject: Subject,
    private readonly wake?: (taskId: string) => void,
  ) {}

  async send(input: ITrainingMessage) {
    const text = typeof input.text === "string" ? input.text.trim() : "";
    if (input.hasAttachments) {
      throw new Error(
        "Validation error. Add files to a knowledge source in the employee profile",
      );
    }
    if (!text || text.length > 8000) {
      throw new Error(
        "Validation error. Send a training message of up to 8000 characters",
      );
    }
    const command =
      /^(?:запомни|remember)(?=\s|[:,.!?]|$)[\s:,.]*(?:что\s+|that\s+)?([\s\S]*)$/iu.exec(
        text,
      );
    const note = command?.[1].trim();
    if (command && (!note || note.length > 2000 || /^[!?]+$/.test(note))) {
      throw new Error(
        "Validation error. Include a training note of up to 2000 characters",
      );
    }
    const social = this.subject.modules.social;
    const saved = await this.subject.repository.withSubjectLock(
      { subjectId: input.actorId },
      async () => {
        const scope = await this.subject.crmWorkspace.employees.scopeForChat(
          input.actorId,
          input.chat,
          input.threadId,
        );
        if (input.actorProfileId !== scope.actorProfileId) {
          throw new Error(
            "Not Found error. Employee training profile is unavailable",
          );
        }

        const key = createHash("sha256")
          .update(
            [
              scope.chatId,
              scope.threadId,
              input.sourceSystemId || randomUUID(),
            ].join(":"),
          )
          .digest("hex");
        const sourceSystemId = `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}${key}`;
        const [previous] = await social.message.find(
          criteria({ sourceSystemId }),
        );
        if (previous) {
          const [[author], [placement]] = await Promise.all([
            social.profilesToMessages.find(
              criteria({
                messageId: previous.id,
                profileId: scope.actorProfileId,
              }),
            ),
            social.threadsToMessages.find(
              criteria({ messageId: previous.id, threadId: scope.threadId }),
            ),
          ]);
          const savedSelection = providerModelSelection.safeParse(
            previous.metadata?.[PROVIDER_MODEL_SELECTION_METADATA_KEY],
          ).data;
          if (
            !author ||
            !placement ||
            previous.description !== text ||
            !isDeepStrictEqual(savedSelection, input.selection)
          ) {
            throw new Error(
              "Conflict error. This request key belongs to another message",
            );
          }
          return { message: previous };
        }

        const message = await this.write(scope, {
          profileId: scope.actorProfileId,
          text,
          sourceSystemId,
          metadata: input.selection
            ? { [PROVIDER_MODEL_SELECTION_METADATA_KEY]: input.selection }
            : undefined,
        });
        if (note) {
          const source = await this.saveNote(scope, message.id, note);
          await this.reply(
            scope,
            message.id,
            this.isRussian(text)
              ? "Сохранил в свои знания."
              : "I saved this to my knowledge.",
            source.id,
          );
          return { message };
        }

        const taskId = await this.enqueue(
          scope,
          input.actorId,
          message.id,
          input.selection,
        );
        if (!taskId) {
          const excerpts = await this.references(scope, text, true);
          const russian = this.isRussian(text);
          let reply = russian
            ? "Для диалога с ИИ нужен текстовый провайдер и опубликованный в магазине бюджет с оплатой владельцем."
            : "AI replies require a text provider and a published store-owner budget.";
          if (excerpts.length) {
            const heading = russian ? "Из моих знаний" : "From my knowledge";
            reply = `${heading}\n\n${excerpts.map(({ text }) => text).join("\n\n")}`;
          }
          await this.reply(scope, message.id, reply);
        }
        return { message, taskId };
      },
    );
    if (saved.taskId) {
      this.wake?.(saved.taskId);
    }
    return saved.message;
  }

  private isRussian(text: string) {
    return /\p{Script=Cyrillic}/u.test(text);
  }

  private async write(
    scope: IStoreEmployeeTrainingScope,
    input: {
      profileId: string;
      text: string;
      sourceSystemId: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const social = this.subject.modules.social;
    const message = await social.message.createWorkMessage({
      description: input.text,
      sourceSystemId: input.sourceSystemId,
      metadata: input.metadata,
    });
    await social.profilesToMessages.create({
      data: { messageId: message.id, profileId: input.profileId },
    });
    await social.chatsToMessages.create({
      data: { messageId: message.id, chatId: scope.chatId },
    });
    await social.threadsToMessages.create({
      data: { messageId: message.id, threadId: scope.threadId },
    });
    return message;
  }

  private async reply(
    scope: IStoreEmployeeTrainingScope,
    messageId: string,
    text: string,
    sourceId?: string,
  ) {
    await this.write(scope, {
      profileId: scope.profileId,
      text,
      sourceSystemId: `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}reply:${messageId}`,
      metadata: withSocialMessageSystemMetadata({
        source: "crm.employee-training",
        metadata: sourceId ? { employeeTrainingSourceId: sourceId } : undefined,
      }),
    });
  }

  private async saveNote(
    scope: IStoreEmployeeTrainingScope,
    messageId: string,
    content: string,
  ) {
    const { knowledge, social } = this.subject.modules;
    const title = content.split("\n")[0].slice(0, 100);
    const source = await knowledge.source.upsertSourceBySlug({
      slug: `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX.replace(/:$/, "")}-${messageId}`,
      variant: "default",
      title,
      content,
    });
    await social.profilesToKnowledgeModuleSources.create({
      data: {
        variant: "default",
        storeId: scope.storeId,
        profileId: scope.profileId,
        knowledgeModuleSourceId: source.id,
      },
    });
    await social.messagesToKnowledgeModuleSources.create({
      data: { messageId, knowledgeModuleSourceId: source.id, kind: "origin" },
    });
    return source;
  }

  private async enqueue(
    scope: IStoreEmployeeTrainingScope,
    actorId: string,
    messageId: string,
    selection?: IProviderModelSelection,
  ) {
    const { crm, social } = this.subject.modules;
    const [budget, grants] = await Promise.all([
      crm.funnel.trainingBudget(scope.storeId),
      this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({
          subjectId: actorId,
          ecommerceModuleStoreId: scope.storeId,
          variant: "owner",
        }),
      ),
    ]);
    if (!budget || !grants.length) {
      return;
    }
    try {
      const provider = await this.subject.providerConnections.resolve(
        scope.storeId,
        scope.subjectId,
        "text",
        selection,
      );
      if (provider.ownerId !== actorId) {
        return;
      }
    } catch (error) {
      if ([403, 404].includes(getHttpErrorType(error).status)) {
        return;
      }
      throw error;
    }

    const [link] = await social.threadsToCrmModuleTasks.find(
      criteria({ threadId: scope.threadId }),
    );
    let task = link
      ? await crm.task.get({
          storeId: scope.storeId,
          taskId: link.crmModuleTaskId,
        })
      : undefined;
    if (
      task &&
      (!isStoreEmployeeTraining(task.openingKey) || task.customerId !== actorId)
    ) {
      throw new Error(
        "Conflict error. This thread belongs to another conversation",
      );
    }
    if (!task || task.publicationId !== budget.id) {
      task = await crm.task.openEmployeeTraining({
        storeId: scope.storeId,
        funnelId: budget.funnelId,
        expectedPublicationId: budget.id,
        customerId: actorId,
        actorId,
        operationKey: openingKey(scope.threadId, budget.id),
      });
      if (link) {
        await social.threadsToCrmModuleTasks.update({
          id: link.id,
          data: { crmModuleTaskId: task.id },
        });
      } else {
        await social.threadsToCrmModuleTasks.create({
          data: { threadId: scope.threadId, crmModuleTaskId: task.id },
        });
      }
    }
    const taskId = task.id;
    return crm.task.withTask(
      { storeId: scope.storeId, taskId },
      async (locked) => {
        const assigned = await this.assign(locked, scope.subjectId, actorId);
        const recorded = await crm.task.activity({
          storeId: scope.storeId,
          taskId: assigned.id,
          actorId,
          expectedRevision: assigned.revision,
          operationKey: `employee-training-message:${messageId}`,
          kind: "customer-message",
          messageId,
        });
        await social.messagesToCrmModuleTaskEvents.create({
          data: {
            messageId,
            crmModuleTaskEventId: recorded.event.id,
            pending: true,
          },
        });
        return taskId;
      },
    );
  }

  private async assign(task: ITask, assigneeId: string, actorId: string) {
    if (task.assigneeId === assigneeId && task.assigneeKind === "ai") {
      return task;
    }
    if (task.assigneeId) {
      throw new Error(
        "Conflict error. The employee training assignment changed",
      );
    }
    return this.subject.modules.crm.task.assign(
      {
        storeId: task.storeId,
        taskId: task.id,
        actorId,
        expectedRevision: task.revision,
        assigneeId,
        assigneeKind: "ai",
        operationKey: `employee-training-assignment:${task.id}`,
      },
      "system",
    );
  }

  async references(
    scope: IStoreEmployeeTrainingScope,
    question: string,
    matchesOnly = false,
  ) {
    const { knowledge, social } = this.subject.modules;
    const links = await social.profilesToKnowledgeModuleSources.find(
      criteria({ profileId: scope.profileId, variant: "default" }),
    );
    const sources = await knowledge.source.findSourcesByIds(
      links
        .filter(
          ({ storeId, offerId, projectId }) =>
            (!storeId || storeId === scope.storeId) && !offerId && !projectId,
        )
        .map(({ knowledgeModuleSourceId }) => knowledgeModuleSourceId),
    );
    const words = [
      ...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []),
    ];
    return sources
      .filter(({ variant }) => variant === "default")
      .flatMap(({ id, contentHash, title, content }) =>
        content.split(/\n{2,}/).map((paragraph) => {
          const haystack = `${title} ${paragraph}`.toLowerCase();
          return {
            id,
            version: contentHash,
            text: `### ${title}\n\n${paragraph.slice(0, 1800)}`,
            matches: words.filter((word) => haystack.includes(word)).length,
          };
        }),
      )
      .filter(({ matches }) => !matchesOnly || matches > 0)
      .sort(
        (left, right) =>
          right.matches - left.matches || left.id.localeCompare(right.id),
      )
      .slice(0, 4);
  }
}

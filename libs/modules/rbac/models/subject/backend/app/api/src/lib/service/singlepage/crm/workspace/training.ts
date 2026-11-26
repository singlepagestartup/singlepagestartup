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
import { Service as ProfileSources } from "../../social-module/profile/knowledge/sources";
import {
  customerWorkAttachments,
  customerWorkAttachmentDigest,
  isCustomerWorkImage,
  prepareCustomerWorkAttachments,
  storeCustomerWorkAttachments,
} from "../../ecommerce/customer-work/media";
import { criteria } from "../../ecommerce/customer-work/utils";
import { ServerWorkCredentialUnavailable } from "../../provider-connections";
import type { IStoreEmployeeTrainingScope } from "./employees";
import type { ICustomerWorkSourceVersion } from "@sps/rbac/models/subject/sdk/model";

import { McpSenderSession } from "../../social-module/profile/mcp/sender-session";

interface ITrainingMessage {
  senderAccessToken?: string;
  actorId: string;
  actorProfileId: string;
  chat: IChat;
  threadId: string;
  text: unknown;
  sourceSystemId?: string;
  selection?: IProviderModelSelection;
  attachments: File[];
}

interface ITrainingReference extends ICustomerWorkSourceVersion {
  text: string;
}

export function employeeTrainingNote(text: string) {
  const command =
    /^(?:запомни(?: с изображением)?|remember(?: with image)?)(?=\s|[:,.!?]|$)[\s:,.]*(?:что\s+|that\s+)?([\s\S]*)$/iu.exec(
      text.trim(),
    );
  return command?.[1].trim();
}

/** Text-only follow-ups can point back to a previously uploaded photograph. */
export function refersToTrainingImage(
  question: string,
  followsUpload: boolean,
) {
  const image =
    /фото|картинк|изображени|обложк|скриншот|рисунк|рисунок|сним(?:ок|к)|иллюстрац|\b(?:images?|photos?|photographs?|pictures?|screenshots?|covers?|illustrations?)\b/iu;
  const reference =
    /последн|предыдущ|прислан|приложен|прикрепл|отправлен|выше|эту|этой|этом|\b(?:attached|previous|last|latest|this|that|above|uploaded)\b/iu;
  const inspection =
    /что (?:на|в )|как (?:тебе|выглядит)|посмотри|анализир|разбери|проверь|проверить|оцени|опиш|описани|изображ[её]н|видн|нарисован|показан|прочитай|написан|цвет|композици|фон|\b(?:inspect|review|describe|see|visible|shows?|showing|says?|on|in|colou?r|design|layout|background)\b/iu;
  if (
    image.test(question) &&
    (reference.test(question) || inspection.test(question))
  ) {
    return true;
  }
  if (
    /что (?:на н[её]м|на ней)|что (?:(?:здесь|тут|там) )?изображено|\bwhat (?:is|can you see) in (?:it|this)\b/iu.test(
      question,
    )
  ) {
    return true;
  }
  return (
    followsUpload &&
    /что (?:это|там|скажешь|думаешь|(?:ты )?видишь)|как тебе|оцени|какого цвета|опиши|\b(?:what do you think|what is this|what do you see|what colou?r|describe (?:it|this))\b/iu.test(
      question,
    )
  );
}

function openingKey(threadId: string, funnelId: string) {
  return `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}${threadId}:${funnelId}`;
}

export function employeeTrainingThreadId(
  task: Pick<ITask, "openingKey" | "funnelId" | "publicationId">,
) {
  const [id] = task.openingKey
    .slice(STORE_EMPLOYEE_TRAINING_KEY_PREFIX.length)
    .split(":");
  if (
    task.openingKey === openingKey(id, task.funnelId) ||
    task.openingKey === openingKey(id, task.publicationId)
  ) {
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
    if ((!text && !input.attachments.length) || text.length > 8000) {
      throw new Error(
        "Validation error. Send a file or a training message of up to 8000 characters",
      );
    }
    const note = employeeTrainingNote(text);
    const withImage =
      /^(?:запомни с изображением|remember with image)(?=[:\s,.!?]|$)/iu.test(
        text,
      );
    if (
      note !== undefined &&
      (!note || note.length > 2000 || /^[!?]+$/.test(note))
    ) {
      throw new Error(
        "Validation error. Include a training note of up to 2000 characters",
      );
    }
    const social = this.subject.modules.social;
    const saved = await this.subject.repository.withSubjectLock(
      { subjectId: input.actorId, savepoint: Boolean(note) },
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

        const attachments = await prepareCustomerWorkAttachments(
          input.attachments,
        );
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
          const savedFiles = customerWorkAttachments(previous);
          if (
            !author ||
            !placement ||
            previous.description !== text ||
            !isDeepStrictEqual(savedSelection, input.selection) ||
            savedFiles.length !== attachments.length ||
            savedFiles.some(({ name, mimeType, digest }, index) => {
              const attachment = attachments[index];
              return (
                name !== attachment.name ||
                mimeType !== attachment.mimeType ||
                digest !== customerWorkAttachmentDigest(attachment)
              );
            })
          ) {
            throw new Error(
              "Conflict error. This request key belongs to another message",
            );
          }
        }

        let message = previous;
        if (!message) {
          const stored = await storeCustomerWorkAttachments(
            this.subject,
            attachments,
            input.actorId,
          );
          let replyImage;
          if (text && note === undefined) {
            const current = stored.findLast(isCustomerWorkImage);
            if (current) {
              replyImage = { id: current.id, digest: current.digest };
            } else if (
              !stored.length &&
              (refersToTrainingImage(text, true) ||
                /\.(?:jpe?g|png|webp)\b/i.test(text))
            ) {
              replyImage = await this.subject.customerWork.priorEmployeeImage(
                scope,
                text,
              );
            }
          }
          const metadata = {
            ...(text &&
              note === undefined && {
                employeeTrainingReplyImage: replyImage ?? null,
              }),
            ...(input.selection && {
              [PROVIDER_MODEL_SELECTION_METADATA_KEY]: input.selection,
            }),
            ...(stored.length && { customerWorkAttachments: stored }),
          };
          message = await this.write(scope, {
            profileId: scope.actorProfileId,
            text,
            sourceSystemId,
            metadata: Object.keys(metadata).length ? metadata : undefined,
          });
        }
        if (note) {
          const sources = new ProfileSources(this.subject);
          let sourceId;
          if (previous) {
            const [confirmation] = await social.message.find(
              criteria({
                sourceSystemId: this.replyKey(message.id, "indexed"),
              }),
            );
            if (confirmation) {
              return { message };
            }
            sourceId = await this.noteSourceId(scope, message.id, note);
            if (!sourceId) {
              throw new Error(
                "Conflict error. The original training note is no longer linked to this message",
              );
            }
          } else {
            const source = await sources.save({
              slug: `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX.replace(/:$/, "")}-${message.id}`,
              title: note.split("\n")[0].slice(0, 100),
              content: note,
              profileId: scope.profileId,
              storeId: scope.storeId,
              messageId: message.id,
            });
            sourceId = source.id;
            const files = customerWorkAttachments(message);
            const images = files.filter(isCustomerWorkImage);
            if (withImage && !files.length) {
              const image = await this.subject.customerWork.priorEmployeeImage(
                scope,
                "присланное изображение",
              );
              if (!image) {
                throw new Error(
                  "Validation error. Attach the reference image in this thread first.",
                );
              }
              await this.subject.modules.knowledge.source.attachPrivateImage(
                sourceId,
                image,
              );
            } else {
              if (withImage && !images.length) {
                throw new Error("Validation error. Attach a reference image.");
              }
              for (const image of images) {
                await this.subject.modules.knowledge.source.attachPrivateImage(
                  sourceId,
                  image,
                );
              }
            }
          }
          await sources.index(sourceId);
          const activeScope =
            await this.subject.crmWorkspace.employees.scopeForChat(
              input.actorId,
              input.chat,
              input.threadId,
            );
          if (!isDeepStrictEqual(scope, activeScope)) {
            throw new Error(
              "Not Found error. Employee training profile is unavailable",
            );
          }
          const reply = this.isRussian(text)
            ? "Заметка сохранена и доступна для поиска."
            : "The note was saved and is searchable.";
          await this.reply(scope, `${message.id}:indexed`, reply, sourceId);
          return { message };
        }
        if (!text || previous) {
          return { message };
        }

        if (input.senderAccessToken) {
          await new McpSenderSession().save(
            message.id,
            input.actorId,
            input.senderAccessToken,
          );
        }
        const taskId = await this.enqueue(
          scope,
          input.actorId,
          message.id,
          input.selection,
        );
        if (!taskId) {
          const reply = this.isRussian(text)
            ? "Для диалога с ИИ нужен текстовый провайдер и настроенный в магазине бюджет с оплатой владельцем."
            : "AI replies require a text provider and a configured store-owner budget.";
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

  private replyKey(messageId: string, status?: "indexed") {
    const base = `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}reply:${messageId}`;
    return status ? `${base}:${status}` : base;
  }

  private async noteSourceId(
    scope: IStoreEmployeeTrainingScope,
    messageId: string,
    note: string,
  ) {
    const { social, knowledge } = this.subject.modules;
    const links = await social.messagesToKnowledgeModuleSources.find(
      criteria({ messageId, kind: "origin" }),
    );
    if (links.length !== 1) {
      return undefined;
    }
    const id = links[0].knowledgeModuleSourceId;
    const [source] = await knowledge.source.lock([id]);
    const profileLinks = await social.profilesToKnowledgeModuleSources.find(
      criteria({ knowledgeModuleSourceId: id }),
    );
    const [link] = profileLinks;
    if (
      source?.variant !== "default" ||
      source.content !== note ||
      profileLinks.length !== 1 ||
      link.profileId !== scope.profileId ||
      (link.storeId && link.storeId !== scope.storeId) ||
      link.variant !== "default" ||
      link.offerId ||
      link.projectId
    ) {
      return undefined;
    }
    return id;
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
      // A PostgreSQL transaction can span several messages. Record their actual placement times.
      data: {
        messageId: message.id,
        threadId: scope.threadId,
        createdAt: new Date(),
      },
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
      sourceSystemId: this.replyKey(messageId),
      metadata: withSocialMessageSystemMetadata({
        source: "crm.employee-training",
        metadata: sourceId ? { employeeTrainingSourceId: sourceId } : undefined,
      }),
    });
  }

  private async enqueue(
    scope: IStoreEmployeeTrainingScope,
    actorId: string,
    messageId: string,
    selection?: IProviderModelSelection,
  ) {
    const { crm, social } = this.subject.modules;
    const [budget, grants] = await Promise.all([
      crm.funnel.trainingBudget(scope.storeId, actorId),
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
      await this.subject.providerConnections.resolveWork(
        scope.storeId,
        scope.subjectId,
        "text",
        { payer: "store-owner", preferredOwnerId: actorId },
        selection,
      );
    } catch (error) {
      if (error instanceof ServerWorkCredentialUnavailable) {
        throw error;
      }
      if ([403, 404].includes(getHttpErrorType(error).status)) {
        return;
      }
      throw error;
    }

    const link = await social.chatsToCrmModuleTasks.forThread(
      scope.threadId,
      scope.chatId,
    );
    let task = link
      ? await crm.task.get({
          storeId: scope.storeId,
          taskId: link.crmModuleTaskId,
        })
      : undefined;
    if (
      task &&
      (!isStoreEmployeeTraining(task.openingKey) ||
        employeeTrainingThreadId(task) !== scope.threadId ||
        task.customerId !== actorId)
    ) {
      throw new Error(
        "Conflict error. This thread belongs to another conversation",
      );
    }
    if (!task || task.funnelId !== budget.id) {
      task = await crm.task.openEmployeeTraining({
        storeId: scope.storeId,
        funnelId: budget.id,
        expectedFunnelRevision: budget.revision,
        customerId: actorId,
        actorId,
        operationKey: openingKey(scope.threadId, budget.id),
      });
      if (link) {
        await social.chatsToCrmModuleTasks.update({
          id: link.id,
          data: { crmModuleTaskId: task.id },
        });
      } else {
        await social.chatsToCrmModuleTasks.create({
          data: { chatId: scope.chatId, crmModuleTaskId: task.id },
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
        await crm.tasksToStages.setPending(recorded.event.id, true);
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

  async knowledgeScope(scope: IStoreEmployeeTrainingScope) {
    const { knowledge, social } = this.subject.modules;
    const links = await social.profilesToKnowledgeModuleSources.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "inArray",
              value: [scope.profileId, scope.actorProfileId],
            },
          ],
        },
      },
    });
    const defaultIds = new Set<string>();
    const personalIds = new Set<string>();
    const managerIds = new Set<string>();
    for (const link of links) {
      if (
        link.offerId ||
        link.projectId ||
        (link.storeId && link.storeId !== scope.storeId)
      ) {
        continue;
      }
      const actor = link.profileId === scope.actorProfileId;
      if (
        (actor || link.profileId === scope.profileId) &&
        link.variant === "default"
      ) {
        defaultIds.add(link.knowledgeModuleSourceId);
        if (actor) {
          managerIds.add(link.knowledgeModuleSourceId);
        }
      }
      if (actor && link.variant === "customer-memory") {
        personalIds.add(link.knowledgeModuleSourceId);
        managerIds.add(link.knowledgeModuleSourceId);
      }
    }
    const ids = [...new Set([...defaultIds, ...personalIds])];
    const sources = await knowledge.source.findSourcesByIds(ids);
    const candidates = sources.filter(
      ({ id, variant }) =>
        (variant === "default" && defaultIds.has(id)) ||
        (variant === "customer-memory" && personalIds.has(id)),
    );
    return {
      knowledgeSourceIds: candidates.map(({ id }) => id),
      knowledgeCandidateVersions: candidates.map(({ id, contentHash }) => ({
        id,
        version: contentHash,
      })),
      personalKnowledgeSourceIds: candidates
        .filter(({ id }) => managerIds.has(id))
        .map(({ id }) => id),
    };
  }

  async references(
    scope: Awaited<ReturnType<Service["knowledgeScope"]>>,
    question: string,
  ): Promise<ITrainingReference[]> {
    if (!scope.knowledgeSourceIds.length) {
      return [];
    }
    const { knowledge } = new ProfileSources(this.subject);
    const excerpts = await knowledge.searchAuthorizedSources({
      sourceIds: scope.knowledgeSourceIds,
      personalSourceIds: scope.personalKnowledgeSourceIds,
      query: question,
      topK: 4,
      finalTopK: 4,
    });
    const versions = new Map(
      scope.knowledgeCandidateVersions.map(({ id, version }) => [id, version]),
    );
    return excerpts.flatMap(
      ({ sourceId, sourceTitle, sourceVersion, text }) => {
        const version = sourceId && versions.get(sourceId);
        if (!sourceId || !version || sourceVersion !== version) {
          return [];
        }
        return [
          {
            id: sourceId,
            version,
            text: `### ${sourceTitle || "Source"}\n\n${text.slice(0, 1800)}`,
          },
        ];
      },
    );
  }
}

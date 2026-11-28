import { createHash } from "node:crypto";
import type { IModel as CrmTask } from "@sps/crm/models/task/sdk/model";
import { canDiscussCompletedOrder } from "@sps/rbac/models/subject/sdk/model";
import { withSocialMessageSystemMetadata } from "@sps/social/models/message/sdk/model";
import { ORDER_SUPPORT_THREAD_VARIANT } from "@sps/social/relations/chats-to-threads/sdk/model";
import type { Service as Subject } from "../../index";
import { Service as AssignmentCandidates } from "../../crm/workspace/assignment-candidates";
import {
  customerWorkAttachmentDigest,
  customerWorkAttachments,
  prepareCustomerWorkAttachments,
  storeCustomerWorkAttachments,
} from "./media";
import { criteria, inIds } from "./utils";

interface IThreadScope {
  chatId: string;
  threadId: string;
}

interface IMessageInput extends IThreadScope {
  customerId: string;
  profileId: string;
  text: unknown;
  sourceSystemId?: string;
  attachments?: File[];
}

export class Service {
  constructor(private readonly subject: Subject) {}

  private get social() {
    return this.subject.modules.social;
  }

  private get tasks() {
    return this.subject.modules.crm.task;
  }

  private async storeOwner(storeId: string) {
    const [grant] =
      await this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({ ecommerceModuleStoreId: storeId, variant: "owner" }),
      );
    if (!grant) {
      return undefined;
    }
    const owner = await this.subject.findById({ id: grant.subjectId });
    if (owner && !["agent", "anonymous", "hidden"].includes(owner.variant)) {
      return owner.id;
    }
    return undefined;
  }

  async canRead(subjectId: string, task: CrmTask) {
    return (
      canDiscussCompletedOrder(task) &&
      (subjectId === task.customerId ||
        subjectId === (await this.storeOwner(task.storeId)))
    );
  }

  async find(taskId: string, chatId: string) {
    const [thread] = await this.social.thread.find(
      criteria({ slug: `order-support-${taskId}` }),
    );
    if (!thread) {
      return undefined;
    }
    const [placement] = await this.social.chatsToThreads.find(
      criteria({
        threadId: thread.id,
        chatId,
        variant: ORDER_SUPPORT_THREAD_VARIANT,
      }),
    );
    return placement ? thread.id : undefined;
  }

  async ensure(task: CrmTask) {
    if (!canDiscussCompletedOrder(task)) {
      return;
    }
    return this.tasks.withTask(
      { storeId: task.storeId, taskId: task.id },
      async (locked) => {
        if (!canDiscussCompletedOrder(locked)) {
          return;
        }
        const channels = await this.social.chatsToCrmModuleTasks.channels({
          taskId: locked.id,
        });
        const [channel] = channels;
        if (
          !channel ||
          channels.some(({ chatId }) => chatId !== channel.chatId)
        ) {
          return;
        }
        const { chatId } = channel;
        const existing = await this.find(locked.id, chatId);
        if (existing) {
          return existing;
        }
        const ownerId = await this.storeOwner(locked.storeId);
        if (!ownerId) {
          return;
        }
        const profileId =
          await this.subject.crmWorkspace.employees.ensureActorProfile(ownerId);
        const profile = await this.social.profile.findById({ id: profileId });
        if (
          !profile ||
          ["artificial-intelligence", "hidden"].includes(profile.variant)
        ) {
          return;
        }
        await new AssignmentCandidates(this.subject).attach(chatId, profileId);
        const thread = await this.social.thread.create({
          data: {
            slug: `order-support-${locked.id}`,
            title: "Поддержка",
            metadata: { orderSupportTaskId: locked.id },
          },
        });
        await this.social.chatsToThreads.create({
          data: {
            chatId,
            threadId: thread.id,
            variant: ORDER_SUPPORT_THREAD_VARIANT,
          },
        });
        await this.write({
          chatId,
          threadId: thread.id,
          profileId,
          text: "Спасибо за заказ! Если у вас есть вопросы по заказу или нужна помощь, напишите нам здесь.",
        });
        return thread.id;
      },
    );
  }

  async taskForThread(threadId: string, chatId?: string) {
    const [placement] = await this.social.chatsToThreads.find(
      criteria({
        threadId,
        ...(chatId ? { chatId } : {}),
        variant: ORDER_SUPPORT_THREAD_VARIANT,
      }),
    );
    if (!placement) {
      return;
    }
    const thread = await this.social.thread.findById({ id: threadId });
    const taskId = thread?.metadata.orderSupportTaskId;
    if (typeof taskId === "string") {
      const [link] = await this.social.chatsToCrmModuleTasks.find(
        criteria({ chatId: placement.chatId, crmModuleTaskId: taskId }),
      );
      if (link) {
        const task = await this.tasks.findById({ id: taskId });
        if (task?.orderId && canDiscussCompletedOrder(task)) {
          return { task, chatId: placement.chatId };
        }
      }
    }
    throw new Error("Not Found error. Order support is unavailable");
  }

  async threadIdsForChat(chatId: string) {
    const threads = await this.social.chatsToThreads.find(
      criteria({ chatId, variant: ORDER_SUPPORT_THREAD_VARIANT }),
    );
    return threads.map(({ threadId }) => threadId);
  }

  async messageIdsForChat(chatId: string) {
    const threadIds = await this.threadIdsForChat(chatId);
    if (!threadIds.length) {
      return [];
    }
    const placements = await this.social.threadsToMessages.find(
      inIds("threadId", threadIds),
    );
    return placements.map(({ messageId }) => messageId);
  }

  async prepareChat(subjectId: string, chatId: string) {
    const links = await this.social.chatsToCrmModuleTasks.find(
      criteria({ chatId }),
    );
    const tasks = links.length
      ? await this.tasks.find(
          inIds(
            "id",
            links.map(({ crmModuleTaskId }) => crmModuleTaskId),
            { status: "closed", outcome: "completed" },
          ),
        )
      : [];
    const completedTaskIds = new Set<string>();
    const supportByTask = new Map<string, string>();
    for (const task of tasks) {
      if (!canDiscussCompletedOrder(task)) {
        continue;
      }
      completedTaskIds.add(task.id);
      if (await this.canRead(subjectId, task)) {
        const threadId = await this.ensure(task);
        if (threadId) {
          supportByTask.set(task.id, threadId);
        }
      }
    }
    return { completedTaskIds, supportByTask };
  }

  async send(input: IMessageInput) {
    const scope = await this.taskForThread(input.threadId, input.chatId);
    if (!scope) {
      return;
    }
    const { task } = scope;
    if (!(await this.canRead(input.customerId, task))) {
      throw new Error("Not Found error. Order support is unavailable");
    }
    const text = typeof input.text === "string" ? input.text.trim() : "";
    const attachments = await prepareCustomerWorkAttachments(
      input.attachments ?? [],
    );
    if ((!text && !attachments.length) || text.length > 8000) {
      throw new Error(
        "Validation error. Send a file or a message of up to 8000 characters",
      );
    }
    return this.tasks.withTask(
      { storeId: task.storeId, taskId: task.id },
      async (locked) => {
        const [links, profile] = await Promise.all([
          this.subject.module.subjectsToSocialModuleProfiles.find(
            criteria({ socialModuleProfileId: input.profileId }),
          ),
          this.social.profile.findById({ id: input.profileId }),
        ]);
        const authors = new Set(
          links
            .filter(
              ({ variant }) => variant === "default" || variant === "telegram",
            )
            .map(({ subjectId }) => subjectId),
        );
        if (
          !(await this.canRead(input.customerId, locked)) ||
          !profile ||
          ["artificial-intelligence", "hidden"].includes(profile.variant) ||
          authors.size !== 1 ||
          !authors.has(input.customerId)
        ) {
          throw new Error("Not Found error. Order support is unavailable");
        }
        let sourceSystemId;
        if (input.sourceSystemId) {
          const key = createHash("sha256")
            .update(
              JSON.stringify([
                input.threadId,
                input.profileId,
                input.sourceSystemId,
              ]),
            )
            .digest("hex");
          sourceSystemId = `order-support:${key}`;
          const [previous] = await this.social.message.find(
            criteria({ sourceSystemId, variant: "customer-work" }),
          );
          if (previous) {
            const files = customerWorkAttachments(previous);
            if (
              previous.description !== text ||
              files.length !== attachments.length ||
              attachments.some(
                (file, index) =>
                  files[index].name !== file.name ||
                  files[index].digest !== customerWorkAttachmentDigest(file),
              )
            ) {
              throw new Error(
                "Conflict error. This request key belongs to another message",
              );
            }
            return previous;
          }
        }
        const files = await storeCustomerWorkAttachments(
          this.subject,
          attachments,
          input.customerId,
        );
        return this.write({ ...input, text, sourceSystemId, files });
      },
    );
  }

  private async write(
    input: IThreadScope & {
      profileId: string;
      text: string;
      sourceSystemId?: string;
      files?: Awaited<ReturnType<typeof storeCustomerWorkAttachments>>;
    },
  ) {
    const message = await this.social.message.createWorkMessage({
      description: input.text,
      sourceSystemId: input.sourceSystemId,
      metadata: withSocialMessageSystemMetadata({
        source: ORDER_SUPPORT_THREAD_VARIANT,
        metadata: input.files?.length
          ? { customerWorkAttachments: input.files }
          : {},
      }),
    });
    await this.social.profilesToMessages.create({
      data: { profileId: input.profileId, messageId: message.id },
    });
    await this.social.chatsToMessages.create({
      data: { chatId: input.chatId, messageId: message.id },
    });
    await this.social.threadsToMessages.create({
      data: { threadId: input.threadId, messageId: message.id },
    });
    return message;
  }
}

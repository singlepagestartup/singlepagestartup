import type { IModel as Chat } from "@sps/social/models/chat/sdk/model";
import type { IModel as ITask } from "@sps/crm/models/task/sdk/model";
import { ORDER_SUPPORT_THREAD_VARIANT } from "@sps/social/relations/chats-to-threads/sdk/model";
import type { Service as Subject } from "../../index";
import { criteria, inIds } from "../../ecommerce/customer-work/utils";

export interface IScope {
  storeId: string;
  taskId: string;
  chatId: string;
  mainThreadId: string;
  customerId: string;
  assigneeId: ITask["assigneeId"];
  sharedCustomerChannel: boolean;
}

export class Service {
  constructor(private readonly subject: Subject) {}

  async presentation(subjectId: string, chatId: string) {
    const scope = await this.scope(subjectId, chatId);
    if (!scope) {
      return { canManageChat: false };
    }
    const protectedProfileIds = await this.protectedProfiles(scope, chatId);
    return {
      canManageChat: true,
      mainThreadId: scope.mainThreadId,
      protectedProfileIds,
    };
  }

  async sharedCustomerThread(task: ITask, chatId: string) {
    if (!task.openingKey.startsWith("channel-intake:")) {
      return undefined;
    }
    const primary = task.openingKey.split(":")[1];
    const threads = await this.subject.modules.social.chatsToThreads.find(
      criteria({ chatId }),
    );
    if (
      threads.some(
        ({ threadId, variant }) =>
          threadId !== primary && variant !== ORDER_SUPPORT_THREAD_VARIANT,
      )
    ) {
      return { taskId: task.id, threadId: primary };
    }
    return undefined;
  }

  async scope(subjectId: string, chatId: string): Promise<IScope | null> {
    if (!(await this.subject.chatOwnership.isOwner(subjectId, chatId))) {
      return null;
    }
    const links = await this.subject.modules.social.chatsToCrmModuleTasks.find(
      criteria({ chatId }),
    );
    if (links.length !== 1) {
      return null;
    }
    const task = await this.subject.modules.crm.task.findById({
      id: links[0].crmModuleTaskId,
    });
    if (!task) {
      return null;
    }
    const channel = await this.subject.customerWork.workspaceChannel(task);
    if (channel?.chatId !== chatId) {
      return null;
    }
    const sharedCustomerChannel = Boolean(
      await this.sharedCustomerThread(task, chatId),
    );
    if (sharedCustomerChannel && task.customerId !== subjectId) {
      return null;
    }
    return {
      taskId: task.id,
      storeId: task.storeId,
      chatId,
      mainThreadId: channel.threadId,
      sharedCustomerChannel,
      customerId: task.customerId,
      assigneeId: task.assigneeId,
    };
  }

  async threadPresentation(
    chatId: string,
    scope: { threadId: string; taskId: string },
    viewerProfileId?: string,
  ) {
    const [thread, task] = await Promise.all([
      this.subject.modules.social.thread.findById({ id: scope.threadId }),
      this.subject.modules.crm.task.findById({ id: scope.taskId }),
    ]);
    if (!thread || !task) {
      throw new Error("Not Found error. The task discussion is unavailable");
    }
    const chat: Chat = {
      id: chatId,
      slug: chatId,
      adminTitle: thread.title ?? "",
      title: thread.title,
      description: null,
      className: null,
      sourceSystemId: null,
      variant: "customer-work",
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
    if (!viewerProfileId) {
      return { chat };
    }
    const profileIds = await this.protectedProfiles(task, chatId);
    const participants = await this.subject.modules.social.profile.find(
      inIds("id", [...profileIds, viewerProfileId]),
    );
    return { chat, participants };
  }

  async protectedProfiles(
    task: Pick<ITask, "customerId" | "assigneeId">,
    chatId: string,
  ) {
    const subjectIds = [task.customerId];
    if (task.assigneeId) {
      subjectIds.push(task.assigneeId);
    }
    const [profiles, members] = await Promise.all([
      this.subject.module.subjectsToSocialModuleProfiles.find(
        inIds("subjectId", subjectIds),
      ),
      this.subject.modules.social.profilesToChats.find(criteria({ chatId })),
    ]);
    const owned = new Set(
      profiles.map(({ socialModuleProfileId }) => socialModuleProfileId),
    );
    return [
      ...new Set(
        members.map(({ profileId }) => profileId).filter((id) => owned.has(id)),
      ),
    ];
  }

  async assertThreadChange(scope: IScope, threadId: string, remove: boolean) {
    if (remove && scope.mainThreadId === threadId) {
      throw new Error(
        "Forbidden error. The primary task discussion must remain in the chat",
      );
    }
    const { social } = this.subject.modules;
    const [link, placements] = await Promise.all([
      social.chatsToCrmModuleTasks.forThread(threadId),
      social.chatsToThreads.find(criteria({ threadId })),
    ]);
    if (
      !link &&
      scope.sharedCustomerChannel &&
      placements.length === 1 &&
      placements[0].chatId === scope.chatId
    ) {
      return;
    }
    if (
      link?.crmModuleTaskId !== scope.taskId ||
      link.chatId !== scope.chatId ||
      placements.length !== 1 ||
      placements[0].chatId !== scope.chatId
    ) {
      throw new Error("Not Found error. Task discussion is unavailable");
    }
    if (remove) {
      const messages = await social.threadsToMessages.find(
        criteria({ threadId }),
      );
      const events = await this.subject.modules.crm.tasksToStages.forMessages(
        scope.taskId,
        messages.map(({ messageId }) => messageId),
      );
      if (events.some(({ pending }) => pending)) {
        throw new Error(
          "Conflict error. A task reply is pending in this discussion",
        );
      }
    }
  }

  async addParticipant(
    scope: IScope,
    actorId: string,
    selection: { profileId?: string; agentSubjectId?: string },
  ) {
    return this.subject.modules.crm.task.withTask(scope, async () => {
      await this.assertOwnerScope(scope, actorId);
      const candidates = await this.subject.crmWorkspace.taskChatCandidates(
        scope.storeId,
      );
      const candidate = candidates.find((item) =>
        selection.agentSubjectId
          ? item.agent &&
            item.subjectId === selection.agentSubjectId &&
            !selection.profileId
          : item.profileId === selection.profileId,
      );
      if (!candidate) {
        throw new Error("Validation error. Choose an employee of this store");
      }
      const relation = this.subject.modules.social.profilesToChats;
      const key = { chatId: scope.chatId, profileId: candidate.profileId };
      const [existing] = await relation.find(criteria(key));
      if (existing?.variant === "participant") {
        return existing;
      }
      if (existing) {
        return relation.update({
          id: existing.id,
          data: { variant: "participant" },
        });
      }
      return relation.create({ data: { ...key, variant: "participant" } });
    });
  }

  async removeParticipant(scope: IScope, actorId: string, profileId: string) {
    return this.subject.modules.crm.task.withTask(scope, async (task) => {
      await this.assertOwnerScope(scope, actorId);
      const protectedIds = await this.protectedProfiles(task, scope.chatId);
      if (protectedIds.includes(profileId)) {
        throw new Error(
          "Forbidden error. The customer and current assignee must remain in the task chat",
        );
      }
      const relation = this.subject.modules.social.profilesToChats;
      const members = await relation.find(
        criteria({ chatId: scope.chatId, profileId }),
      );
      if (!members.length) {
        throw new Error("Not Found error. Chat participant is unavailable");
      }
      for (const member of members) {
        await relation.delete({ id: member.id });
      }
      return members;
    });
  }

  private async assertOwnerScope(scope: IScope, actorId: string) {
    const current = await this.scope(actorId, scope.chatId);
    if (current?.taskId !== scope.taskId || current.storeId !== scope.storeId) {
      throw new Error("Forbidden error. Chat owner access is required");
    }
  }
}

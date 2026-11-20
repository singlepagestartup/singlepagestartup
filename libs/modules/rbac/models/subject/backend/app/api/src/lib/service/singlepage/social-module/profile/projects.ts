import type { Service as SubjectService } from "../../index";
import type { IAIChatProject } from "@sps/rbac/models/subject/sdk/model";
import { selectPrimaryLinkedThread } from "@sps/social/models/thread/sdk/model";

export interface IFindProps {
  subjectId: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async find({ subjectId }: IFindProps): Promise<IAIChatProject[]> {
    const links = await this.service.module.subjectsToSocialModuleProfiles.find(
      {
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subjectId }],
          },
        },
      },
    );
    const personalIds = links
      .filter((link) => link.variant === "default")
      .map((link) => link.socialModuleProfileId);
    const assistantIds = links
      .filter((link) => link.variant === "assistant")
      .map((link) => link.socialModuleProfileId);
    if (!personalIds.length || !assistantIds.length) return [];
    const profiles = await this.service.modules.social.profile.find({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: assistantIds },
            {
              column: "variant",
              method: "eq",
              value: "artificial-intelligence",
            },
          ],
        },
      },
    });
    if (!profiles.length) return [];
    const memberships = await this.service.modules.social.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "inArray",
              value: [...personalIds, ...profiles.map((profile) => profile.id)],
            },
          ],
        },
      },
    });
    const ownMemberships = memberships.filter((link) =>
      personalIds.includes(link.profileId),
    );
    const ownedChatIds = [
      ...new Set(ownMemberships.map((link) => link.chatId)),
    ];
    if (!ownedChatIds.length) return [];
    const chats = await this.service.modules.social.chat.find({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: ownedChatIds }],
        },
      },
    });
    const threadLinks = await this.service.modules.social.chatsToThreads.find({
      params: {
        filters: {
          and: [{ column: "chatId", method: "inArray", value: ownedChatIds }],
        },
      },
    });
    const threadIds = [...new Set(threadLinks.map((link) => link.threadId))];
    let threads: IAIChatProject["thread"][];
    if (threadIds.length) {
      threads = await this.service.modules.social.thread.find({
        params: {
          filters: {
            and: [{ column: "id", method: "inArray", value: threadIds }],
          },
        },
      });
    } else {
      threads = [];
    }
    const projects: IAIChatProject[] = [];
    for (const chat of chats) {
      const requesterProfileId = ownMemberships.find(
        (link) => link.chatId === chat.id,
      )?.profileId;
      if (!requesterProfileId) {
        continue;
      }
      const chatThreadLinks = threadLinks.filter(
        (link) => link.chatId === chat.id,
      );
      const defaultThreadLinks = chatThreadLinks.filter(
        (link) => link.variant === "default",
      );
      const thread =
        selectPrimaryLinkedThread({
          socialModuleChatsToThreads: defaultThreadLinks,
          socialModuleThreads: threads,
        }) ||
        selectPrimaryLinkedThread({
          socialModuleChatsToThreads: chatThreadLinks,
          socialModuleThreads: threads,
        });
      if (!thread) {
        continue;
      }
      for (const profile of profiles) {
        if (
          memberships.some(
            (link) => link.chatId === chat.id && link.profileId === profile.id,
          )
        ) {
          projects.push({ profile, chat, thread, requesterProfileId });
        }
      }
    }
    return projects;
  }
}

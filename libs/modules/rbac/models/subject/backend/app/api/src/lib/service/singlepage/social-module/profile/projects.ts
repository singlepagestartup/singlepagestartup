import type { Service as SubjectService } from "../../index";
import {
  getAIChatDocument,
  type IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";
import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";

export interface IFindProps {
  subjectId: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async find({ subjectId }: IFindProps): Promise<IAIChatProject[]> {
    const links = await this.service.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        },
      },
    });
    const personalIds = links
      .filter((link) => link.variant === "default")
      .map((link) => link.socialModuleProfileId);
    const assistantIds = links
      .filter((link) => link.variant === "assistant")
      .map((link) => link.socialModuleProfileId);
    if (!personalIds.length || !assistantIds.length) return [];
    const profiles = await this.service.socialModule.profile.find({
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
    const memberships = await this.service.socialModule.profilesToChats.find({
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
    const chats = await this.service.socialModule.chat.find({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: ownedChatIds }],
        },
      },
    });
    const threadLinks = await this.service.socialModule.chatsToThreads.find({
      params: {
        filters: {
          and: [{ column: "chatId", method: "inArray", value: ownedChatIds }],
        },
      },
    });
    const threadIds = [...new Set(threadLinks.map((link) => link.threadId))];
    const threads = threadIds.length
      ? await this.service.socialModule.thread.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: threadIds }],
            },
          },
        })
      : [];
    const projects: IAIChatProject[] = [];
    for (const chat of chats) {
      const requesterProfileId = ownMemberships.find(
        (link) => link.chatId === chat.id,
      )?.profileId;
      if (!requesterProfileId) continue;
      const chatThreadIds = new Set(
        threadLinks
          .filter((link) => link.chatId === chat.id)
          .map((link) => link.threadId),
      );
      const chatThreads = threads.filter((thread) =>
        chatThreadIds.has(thread.id),
      );
      for (const profile of profiles) {
        if (
          !memberships.some(
            (link) => link.chatId === chat.id && link.profileId === profile.id,
          )
        )
          continue;
        const documents = chatThreads.filter(
          (thread) =>
            getAIChatDocument(thread.metadata)?.profileId === profile.id,
        );
        documents.sort(
          (a, b) =>
            AI_CHAT_DOCUMENTS.findIndex(
              (definition) =>
                definition.key === getAIChatDocument(a.metadata)?.key,
            ) -
            AI_CHAT_DOCUMENTS.findIndex(
              (definition) =>
                definition.key === getAIChatDocument(b.metadata)?.key,
            ),
        );
        const thread =
          documents[0] ||
          chatThreads.find((thread) => thread.variant === "default") ||
          chatThreads[0];
        if (thread)
          projects.push({ profile, chat, thread, requesterProfileId });
      }
    }
    return projects;
  }
}

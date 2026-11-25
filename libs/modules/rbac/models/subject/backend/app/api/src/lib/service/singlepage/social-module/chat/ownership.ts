import { withConsistencyTransaction } from "@sps/shared-backend-api";
import type { IModel as Chat } from "@sps/social/models/chat/sdk/model";
import type { Service as SubjectService } from "../../index";

export class Service {
  constructor(private readonly subject: SubjectService) {}

  async isOwner(subjectId: string, chatId: string) {
    const links = await this.subject.module.subjectsToSocialModuleChats.find({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: subjectId },
            { column: "socialModuleChatId", method: "eq", value: chatId },
            { column: "variant", method: "eq", value: "owner" },
          ],
        },
      },
    });
    return links.length > 0;
  }

  async assertOwner(subjectId: string, chatId: string) {
    if (!(await this.isOwner(subjectId, chatId))) {
      throw new Error(
        "Forbidden error. Only the chat owner can manage this chat",
      );
    }
  }

  create(subjectId: string, data: Partial<Chat>) {
    return withConsistencyTransaction(this.subject.repository.db, async () => {
      const chat = await this.subject.modules.social.chat.create({ data });
      await this.subject.module.subjectsToSocialModuleChats.create({
        data: { subjectId, socialModuleChatId: chat.id, variant: "owner" },
      });
      return chat;
    });
  }
}

import type { IModel as Message } from "@sps/social/models/message/sdk/model";
import type { Service as SubjectService } from "../../index";
import { criteria } from "./utils";

export class Service {
  constructor(private readonly subject: SubjectService) {}

  async queue(input: {
    customerId: string;
    chatId: string;
    threadId: string;
    message: Message;
    documentId?: string;
  }) {
    const { social, notification } = this.subject.modules;
    const chat = await social.chat.findById({ id: input.chatId });
    if (chat?.variant !== "telegram" || !chat.sourceSystemId?.match(/^\d+$/)) {
      return;
    }
    const [identity] = await this.subject.module.identity.find(
      criteria({
        provider: "telegram",
        account: chat.sourceSystemId,
      }),
    );
    if (!identity || identity.usage === "outbound_api") {
      return;
    }
    const [owner] = await this.subject.module.subjectsToIdentities.find(
      criteria({
        subjectId: input.customerId,
        identityId: identity.id,
      }),
    );
    if (!owner) {
      return;
    }
    const [templates, topics] = await Promise.all([
      notification.template.find(
        criteria({
          variant: "generate-telegram-social-module-message-created",
        }),
      ),
      notification.topic.find(criteria({ slug: "information" })),
    ]);
    if (!templates[0] || !topics[0]) {
      return;
    }
    const thread = await social.thread.findById({ id: input.threadId });
    const notificationId = input.message.id;
    const attachments = input.documentId
      ? [
          notification.notification.telegramDocument(
            notificationId,
            chat.sourceSystemId,
            input.documentId,
          ),
        ]
      : [];
    const queued = await notification.notification.createDelivery({
      id: notificationId,
      reciever: chat.sourceSystemId,
      attachments,
      data: {
        socialModule: {
          message: {
            description: input.message.description,
            interaction: input.message.interaction,
          },
          thread,
        },
      },
    });
    if (!queued) {
      throw new Error(
        "Conflict error. The chat notification could not be queued",
      );
    }
    await notification.notificationsToTemplates.findOrCreate({
      data: { notificationId: queued.id, templateId: templates[0].id },
    });
    await notification.topicsToNotifications.findOrCreate({
      data: { notificationId: queued.id, topicId: topics[0].id },
    });
  }
}

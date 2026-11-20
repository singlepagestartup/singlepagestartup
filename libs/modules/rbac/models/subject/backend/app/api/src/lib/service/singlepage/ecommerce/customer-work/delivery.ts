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
    const queued = await notification.notification.create({
      data: {
        id: input.message.id,
        reciever: chat.sourceSystemId,
        data: {
          socialModule: {
            message: { description: input.message.description },
            thread,
          },
        },
      },
    });
    await notification.notificationsToTemplates.create({
      data: { notificationId: queued.id, templateId: templates[0].id },
    });
    await notification.topicsToNotifications.create({
      data: { notificationId: queued.id, topicId: topics[0].id },
    });
  }
}

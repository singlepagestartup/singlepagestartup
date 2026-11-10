import { createHash } from "node:crypto";
import type { INotificationModule } from "../../../di";
import type { IModel as ITemplate } from "@sps/notification/models/template/sdk/model";
import { api as topicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as notificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { getNotificationTemplateChannel, logger } from "@sps/backend-utils";

export interface ISendBoundedNotification {
  key: string;
  recipientKey: string;
  method: "email" | "telegram";
  receiver: string;
  topicId: string;
  template: ITemplate;
  data: Record<string, unknown>;
  expiresAt: number;
}

// The caller holds a Broadcast lease across delivery. All channels for a
// recipient share a notification ID and a persisted three-attempt budget.
export class Service {
  constructor(
    private readonly notification: INotificationModule["notification"],
  ) {}

  async execute(props: ISendBoundedNotification) {
    const digest = createHash("sha256")
      .update(`${props.key}:${props.recipientKey}`)
      .digest("hex");
    const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    const previous = await this.notification.findById({ id });
    if (previous?.status === "sent") {
      return { id, status: "sent" };
    }
    const attempts = Number(previous?.data?.attempts) || 0;
    if (attempts >= 3 || Date.now() > props.expiresAt) {
      return { id, status: "error" };
    }
    if (
      getNotificationTemplateChannel(props.template.variant) !== props.method
    ) {
      throw new Error(
        "Configuration error. Template does not match delivery channel",
      );
    }
    const data = { ...props.data, attempts: attempts + 1 };
    const values = {
      variant: `bounded-${props.method}`,
      status: "sending",
      title: props.template.title,
      reciever: props.receiver,
      data,
    };
    if (!previous) {
      await this.notification.createDelivery({ id, ...values });
    } else {
      await this.notification.updateDelivery({ id, data: values });
    }

    try {
      await this.linkTopic(id, props.topicId);
      await this.linkTemplate(id, props.template.id);
      const provider = props.method === "email" ? "Amazon SES" : "Telegram";
      const result = await this.notification.provider({
        id,
        method: props.method,
        provider,
        template: props.template,
        timeoutMs: 5000,
        singleMessage: true,
      });
      return { id, status: result.status };
    } catch {
      logger.warn({
        event: "notification.delivery-failed",
        transport: props.method,
        notificationId: id,
      });
      await this.notification.updateDelivery({ id, data: { status: "error" } });
      return { id, status: "error" };
    }
  }

  private options() {
    if (!RBAC_SECRET_KEY) {
      throw new Error(
        "Configuration error. Notification service credential is missing",
      );
    }
    return {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "error" as const,
    };
  }

  private async linkTopic(notificationId: string, topicId: string) {
    const links = await topicsToNotificationsApi.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "notificationId", method: "eq", value: notificationId },
            { column: "topicId", method: "eq", value: topicId },
          ],
        },
      },
      options: this.options(),
    });
    if (!links?.length) {
      await topicsToNotificationsApi.create({
        data: { notificationId, topicId },
        options: this.options(),
      });
    }
  }

  private async linkTemplate(notificationId: string, templateId: string) {
    const links = await notificationsToTemplatesApi.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "notificationId", method: "eq", value: notificationId },
            { column: "templateId", method: "eq", value: templateId },
          ],
        },
      },
      options: this.options(),
    });
    if (!links?.length) {
      await notificationsToTemplatesApi.create({
        data: { notificationId, templateId },
        options: this.options(),
      });
    }
  }
}

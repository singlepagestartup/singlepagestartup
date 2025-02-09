import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      console.log("Dummy started");

      const topics = await notificationTopicApi.find({
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: "information" }],
          },
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      if (!topics?.length) {
        throw new Error("No topic found");
      }

      const topic = topics[0];

      const templates = await notificationTemplateApi.find({
        params: {
          filters: {
            and: [{ column: "variant", method: "eq", value: "agent-result" }],
          },
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      if (!templates?.length) {
        throw new Error("No template found");
      }
      const template = templates[0];

      const notifications = [
        {
          data: JSON.stringify({ title: "Agent finished" }),
          method: "email",
          reciever: "rogwild.design@gmail.com",
          attachments: "[]",
        },
      ];

      for (const notification of notifications) {
        const createdNotification = await notificationNotificationApi.create({
          data: { ...notification },
          options: {
            headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
          },
        });

        if (!createdNotification) {
          throw new Error("Failed to create notification");
        }

        await notificationNotificationsToTemplatesApi.create({
          data: {
            notificationId: createdNotification.id,
            templateId: template.id,
          },
          options: {
            headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
          },
        });

        await notificationTopicsToNotificationsApi.create({
          data: {
            topicId: topic.id,
            notificationId: createdNotification.id,
          },
          options: {
            headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
          },
        });

        await notificationNotificationApi.send({
          id: createdNotification.id,
          options: {
            headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
          },
        });
      }

      console.log("Dummy finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}

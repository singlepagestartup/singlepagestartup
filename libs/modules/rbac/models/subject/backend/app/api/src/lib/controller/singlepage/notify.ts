import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { IModel as INotificationServiceNotification } from "@sps/notification/models/notification/sdk/model";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. No uuid provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      const subjectsToIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!subjectsToIdentities?.length) {
        return c.json({ data: null });
      }

      const identities = await identityApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectsToIdentities.map((item) => item.identityId),
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!identities?.length) {
        throw new Error("Not Found error. No identities found");
      }

      if (!data.notification?.topic?.slug) {
        throw new Error(
          "Validation error. No notification.topic.slug provided",
        );
      }

      const topics = await notificationTopicApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data.notification.topic.slug,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!topics?.length) {
        throw new Error("Not Found error. No topic found");
      }

      const topic = topics[0];

      if (!data.notification.template) {
        throw new Error(
          "Validation error. No 'data.notification.template' provided",
        );
      }

      const notifications: {
        data: string;
        reciever: string;
        attachments: string;
      }[] = [];

      const type = data.notification.template.variant.includes("email")
        ? "email"
        : data.notification.template.variant.includes("telegram")
          ? "telegram"
          : undefined;

      const attachments = data.fileStorage?.files?.map(
        (fileStorageModuleFile: IFileStorageModuleFile) => {
          return {
            type: "image",
            url: `${NEXT_PUBLIC_API_SERVICE_URL}/public${fileStorageModuleFile.file}`,
          };
        },
      );

      for (const identity of identities) {
        if (type === "email") {
          if (!identity.email) {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            data: data.notification.notification.data,
            reciever: identity.email,
            attachments,
          });
        } else if (type === "telegram") {
          if (identity.provider !== "telegram") {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            data: data.notification.notification.data,
            reciever: identity.account,
            attachments,
          });
        }
      }

      const sentNotificationServiceNotifications: INotificationServiceNotification[] =
        [];

      for (const notification of notifications) {
        const createdNotification = await notificationNotificationApi.create({
          data: {
            ...notification,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!createdNotification) {
          continue;
        }

        await notificationNotificationsToTemplatesApi.create({
          data: {
            notificationId: createdNotification.id,
            templateId: data.notification.template.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await notificationTopicsToNotificationsApi.create({
          data: {
            topicId: topic.id,
            notificationId: createdNotification.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        const sentNotificationServiceNotification =
          await notificationNotificationApi.send({
            id: createdNotification.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

        sentNotificationServiceNotifications.push(
          sentNotificationServiceNotification,
        );
      }

      return c.json({
        data: {
          notificationService: {
            notifications: sentNotificationServiceNotifications,
          },
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

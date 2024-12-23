import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      throw new HTTPException(400, {
        message: "No uuid provided",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid body",
      });
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
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      throw new HTTPException(404, {
        message: "No subjects to identities found",
      });
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
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!identities?.length) {
      throw new HTTPException(404, {
        message: "No identities found",
      });
    }

    if (!data.notification?.notification?.method) {
      throw new HTTPException(400, {
        message: "No notification.notification.method provided",
      });
    }

    if (!data.notification?.topic?.slug) {
      throw new HTTPException(400, {
        message: "No notification.topic.slug provided",
      });
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
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!topics?.length) {
      throw new HTTPException(404, {
        message: "No topic found",
      });
    }

    const topic = topics[0];

    if (!data.notification?.template?.variant) {
      throw new HTTPException(400, {
        message: "No template variant provided",
      });
    }

    if (!["email"].includes(data.notification.notification.method)) {
      throw new HTTPException(400, {
        message: "Invalid notification method",
      });
    }

    const templates = await notificationTemplateApi.find({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: data.notification.template.variant,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!templates?.length) {
      throw new HTTPException(404, {
        message: "No template found",
      });
    }

    const template = templates[0];

    const notifications: {
      data: string;
      method: string;
      reciever: string;
      attachments: string;
    }[] = [];

    if (data.ecommerce?.order?.id) {
      const order = await ecommerceOrderApi.findById({
        id: data.ecommerce.order.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!order) {
        throw new HTTPException(404, {
          message: "No order found",
        });
      }

      for (const identity of identities) {
        if (data.notification.notification.method === "email") {
          if (!identity.email) {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            reciever: identity.email,
            attachments: order?.receipt
              ? JSON.stringify([{ type: "image", url: order.receipt }])
              : "[]",
          });
        }
      }
    } else {
      for (const identity of identities) {
        if (data.notification.notification.method === "email") {
          if (!identity.email) {
            continue;
          }

          notifications.push({
            ...data.notification.notification,
            reciever: identity.email,
            attachments: "[]",
          });
        }
      }
    }

    for (const notification of notifications) {
      const createdNotification = await notificationNotificationApi.create({
        data: {
          ...notification,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!createdNotification) {
        continue;
      }

      await notificationNotificationsToTemplatesApi.create({
        data: {
          notificationId: createdNotification.id,
          templateId: template.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
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
          next: {
            cache: "no-store",
          },
        },
      });

      await notificationNotificationApi.send({
        id: createdNotification.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });
    }

    const entity = await this.service.findById({
      id: uuid,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    return c.json({
      data: entity,
    });
  }
}

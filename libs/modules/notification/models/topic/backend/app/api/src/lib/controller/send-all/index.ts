import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as topicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as notificationApi } from "@sps/notification/models/notification/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY is required",
        });
      }

      const topics = await this.service.find();

      for (const topic of topics) {
        const topicsToNotifications = await topicsToNotificationsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "topicId",
                  method: "eq",
                  value: topic.id,
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

        if (topicsToNotifications?.length) {
          for (const topicToNotification of topicsToNotifications) {
            const notification = await notificationApi.findById({
              id: topicToNotification.notificationId,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  "Cache-Control": "no-store",
                },
              },
            });

            if (!notification || notification.status !== "new") {
              continue;
            }

            await notificationApi
              .send({
                id: notification.id,
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                  next: {
                    cache: "no-store",
                  },
                },
              })
              .then(() => {})
              .catch(() => {
                //
              });
          }
        }
      }

      return c.json({
        ok: true,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}

import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/topic/backend/repository/database";
import { Service } from "../service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as topicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as notificationApi } from "@sps/notification/models/notification/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);

    this.service = service;

    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/dump",
        handler: this.dump,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
      {
        method: "POST",
        path: "/send-all",
        handler: this.sendAll,
      },
    ]);
  }

  async sendAll(c: Context, next: any): Promise<Response> {
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
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}

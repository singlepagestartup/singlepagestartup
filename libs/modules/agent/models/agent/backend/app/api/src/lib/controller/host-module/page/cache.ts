import { HOST_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { logger } from "@sps/backend-utils";
import { api as hostModulePageApi } from "@sps/host/models/page/sdk/server";

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

      logger.info("Host module page cache started");

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

      const urls = await hostModulePageApi.urls({});

      if (urls?.length) {
        for (const [index, url] of urls.entries()) {
          const path = HOST_SERVICE_URL + "/" + url.url.join("/");

          logger.info(`🔄 Revalidating page ${index + 1} of ${urls.length}`, {
            page: path,
          });

          try {
            await this.revalidatePage(path);

            const res = await fetch(path, {
              method: "GET",
            });

            if (!res.ok) {
              throw new Error("Failed to fetch page");
            }

            logger.info(`✅ Revalidated page ${index + 1} of ${urls.length}`, {
              page: path,
            });
          } catch (err) {
            logger.error(path + " - Failed to fetch page", {
              page: path,
              error: err,
            });
          }
        }
      }

      if (topics?.length) {
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

        if (templates?.length) {
          for (const template of templates) {
            const notifications = [
              {
                data: JSON.stringify({ title: "Agent finished" }),
                method: "email",
                reciever: "rogwild.design@gmail.com",
                attachments: "[]",
              },
            ];

            for (const notification of notifications) {
              const createdNotification =
                await notificationNotificationApi.create({
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
          }
        }
      }

      logger.info("Host module page cache finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }

  async revalidatePage(path: string) {
    const res = await fetch(
      HOST_SERVICE_URL + `/api/revalidate?path=${path}&type=page`,
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to revalidate page");
        }
      })
      .catch((err) => {
        logger.error("Failed to revalidate page", {
          error: err,
        });
      });

    return res;
  }
}

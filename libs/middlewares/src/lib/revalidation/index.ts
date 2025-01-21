import { RBAC_SECRET_KEY, STALE_TIME } from "@sps/shared-utils";
import { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { api as broadcastMessageApi } from "@sps/broadcast/models/message/sdk/server";
import { api as broadcastChannelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";

export type IMiddlewareGeneric = unknown;

export class Middleware {
  constructor() {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const path = c.req.path;
      const method = c.req.method;

      await next();

      if (path.includes("/api/broadcast")) {
        return;
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (!RBAC_SECRET_KEY) {
            throw Error(
              "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
            );
          }

          if (["POST", "PUT", "PATCH"].includes(method)) {
            await broadcastChannelApi.pushMessage({
              data: {
                slug: "revalidation",
                payload: path,
                expiresAt: new Date(new Date().getTime() + STALE_TIME * 5),
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
            revalidateTag(path);
          }

          if (["POST", "DELETE"].includes(method)) {
            const pathWithoutId = path.replace(
              /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?*/,
              "",
            );

            await broadcastChannelApi.pushMessage({
              data: {
                slug: "revalidation",
                payload: pathWithoutId,
                expiresAt: new Date(new Date().getTime() + STALE_TIME * 5),
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
            revalidateTag(pathWithoutId);
          }

          const expiredMessages = await broadcastMessageApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "expiresAt",
                    method: "lt",
                    value: new Date(new Date().setSeconds(0, 0)),
                  },
                ],
              },
            },
          });

          expiredMessages?.forEach(async (message) => {
            if (!RBAC_SECRET_KEY) {
              throw Error(
                "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
              );
            }

            const channelsToExpiredMessage =
              await broadcastChannelsToMessagesApi.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "messageId",
                        method: "eq",
                        value: message.id,
                      },
                    ],
                  },
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });

            channelsToExpiredMessage?.forEach(async (channelToMessage) => {
              if (!RBAC_SECRET_KEY) {
                throw Error(
                  "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
                );
              }

              await broadcastChannelApi.messageDelete({
                id: channelToMessage.channelId,
                messageId: message.id,
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
            });
          });
        }
      }
    });
  }

  setRoutes(app: any) {
    app.get("/revalidation/revalidate", async (c: Context<any, any, {}>) => {
      const tag = c.req.query("tag");
      const path = c.req.query("path");
      const type = c.req.query("type");

      if (tag) {
        revalidateTag(tag);
      }

      if (path) {
        if (type && (type === "page" || type === "layout")) {
          revalidatePath(path, type);
        } else {
          revalidatePath(path);
        }
      }

      return c.json({
        revalidated: {
          tag,
          path,
        },
        now: Date.now(),
      });
    });
  }
}

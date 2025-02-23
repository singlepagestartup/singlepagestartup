import {
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  STALE_TIME,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
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
            await broadcastChannelApi
              .pushMessage({
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
              })
              .catch((error) => {
                //
              });
            await this.revalidateTag(path);
          }

          if (["POST", "DELETE"].includes(method)) {
            const pathWithoutId = path.replace(
              /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?*/,
              "",
            );

            await broadcastChannelApi
              .pushMessage({
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
              })
              .catch((error) => {
                //
              });
            await this.revalidateTag(pathWithoutId);
          }

          const expiredMessages = await broadcastMessageApi
            .find({
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
            })
            .catch((error) => {
              //
            });

          expiredMessages?.forEach(async (message) => {
            if (!RBAC_SECRET_KEY) {
              throw Error(
                "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
              );
            }

            const channelsToExpiredMessage =
              await broadcastChannelsToMessagesApi
                .find({
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
                })
                .catch((error) => {
                  //
                });

            channelsToExpiredMessage?.forEach(async (channelToMessage) => {
              if (!RBAC_SECRET_KEY) {
                throw Error(
                  "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
                );
              }

              await broadcastChannelApi
                .messageDelete({
                  id: channelToMessage.channelId,
                  messageId: message.id,
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                })
                .catch((error) => {
                  //
                });
            });
          });
        }
      }
    });
  }

  async revalidateTag(tag: string) {
    try {
      await fetch(HOST_SERVICE_URL + "/api/revalidate?tag=" + tag);
    } catch (error) {
      console.log("🚀 ~ revalidateTag ~ error:", error);
    }
  }
}

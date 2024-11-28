import {
  HOST_URL,
  prepareFormDataToSend,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { api as channelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as channelsToMessagesApi } from "@sps/broadcast/relations/channels-to-messages/sdk/server";
import { api as messagesApi } from "@sps/broadcast/models/message/sdk/server";

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
        if (!RBAC_SECRET_KEY) {
          throw Error(
            "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
          );
        }

        const observerChannels = await channelApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "title",
                  method: "eq",
                  value: "observer",
                },
              ],
            },
          },
          options: {
            next: {
              cache: "no-store",
            },
          },
        });

        if (!observerChannels?.length) {
          return;
        }

        const channelsToMessages = await channelsToMessagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "channelId",
                  method: "inArray",
                  value: observerChannels.map((channel) => channel.id),
                },
              ],
            },
          },
          options: {
            next: {
              cache: "no-store",
            },
          },
        });

        if (!channelsToMessages?.length) {
          return;
        }

        const messages = await messagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: channelsToMessages?.map(
                    (channelToMessage) => channelToMessage.messageId,
                  ),
                },
                {
                  column: "payload",
                  method: "ilike",
                  value: `%${path}%`,
                },
                {
                  column: "payload",
                  method: "ilike",
                  value: `%${method}%`,
                },
              ],
            },
          },
          options: {
            next: {
              cache: "no-store",
            },
          },
        });

        if (messages?.length) {
          for (const message of messages) {
            try {
              const payload = JSON.parse(message.payload);

              if (
                payload.action.method === method &&
                payload.action.url === `${HOST_URL}${path}`
              ) {
                const options: any = {
                  method: payload.callback.method,
                  headers: {
                    ...payload.callback.headers,
                  },
                };

                if (payload.callback.body) {
                  const formData = prepareFormDataToSend(payload.callback.body);

                  options.body = formData;
                }

                fetch(payload.callback.url, options).then(async (res) => {
                  if (res.status >= 200 && res.status < 300) {
                    if (!RBAC_SECRET_KEY) {
                      throw Error(
                        "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
                      );
                    }

                    await messagesApi.delete({
                      id: message.id,
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
                });
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    });
  }
}

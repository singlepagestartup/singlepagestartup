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
import { IModel as IBroadcastMessage } from "@sps/broadcast/models/message/sdk/model";

export type IMiddlewareGeneric = unknown;

export interface IPayload {
  trigger: {
    type: "request";
    method: "POST" | "GET" | "PATCH" | "DELETE";
    url: string;
  };
  pipe: {
    method: "POST" | "GET" | "PATCH" | "DELETE";
    url: string;
    headers: any;
    body: any;
  }[];
}

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

        /**
         * Without passing Cache-Control data are mismathed, because
         * http-cache middleware use this models
         */
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
            headers: {
              "Cache-Control": "no-cache",
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
              const payload: IPayload = JSON.parse(message.payload);

              if (
                payload.trigger.method === method &&
                payload.trigger.url === `${HOST_URL}${path}`
              ) {
                const responseClone = c.res.clone();
                const triggerResult = await responseClone.json();

                this.executePipeline({
                  message,
                  pipe: payload.pipe,
                  index: 0,
                  triggerResult,
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

  async executePipeline(props: {
    message: IBroadcastMessage;
    pipe: IPayload["pipe"];
    index: number;
    triggerResult: any;
    previouseResult?: any;
  }) {
    const { pipe, index, triggerResult, message, previouseResult } = props;

    const options: any = {
      method: props.pipe[index].method,
      headers: {
        ...props.pipe[index].headers,
      },
    };

    if (pipe[index].body) {
      const replaceTemplateWithData = (key: string, data: any, body: any) => {
        const bodyString = JSON.stringify(body);

        const bodyHasTriggerResult = JSON.stringify(pipe[index].body).includes(
          `[${key}.`,
        );

        if (!bodyHasTriggerResult) {
          return body;
        }

        return JSON.parse(
          bodyString.replace(
            new RegExp(`\\[${key}\\.[a-zA-Z0-9.]+\\]`, "g"),
            (match) => {
              const path = match.replace(`[${key}.`, "").replace("]", "");
              const value = path.split(".").reduce((acc, key) => {
                return acc[key];
              }, data);

              return value;
            },
          ),
        );
      };

      const body = replaceTemplateWithData(
        "previouseResult",
        previouseResult,
        replaceTemplateWithData(
          "triggerResult",
          triggerResult,
          pipe[index].body,
        ),
      );

      const formData = prepareFormDataToSend(body);

      options.body = formData;
    }

    const result = await fetch(pipe[index].url, options).then(async (res) => {
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

        const jsonResponse = await res.json();

        return jsonResponse;
      }
    });

    if (pipe.length > index + 1) {
      return this.executePipeline({
        message,
        pipe,
        index: index + 1,
        triggerResult,
        previouseResult: result,
      });
    }
  }
}

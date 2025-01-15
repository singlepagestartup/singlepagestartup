import { BACKEND_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api } from "@sps/agent/models/agent/sdk/server";
import cronParser from "cron-parser";

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

    const agents = await api.find({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const cronChannels = await broadcastChannelApi.find({
      params: {
        filters: {
          and: [
            {
              column: "title",
              method: "eq",
              value: "cron",
            },
          ],
        },
      },
    });

    if (!cronChannels) {
      throw new HTTPException(400, {
        message: "Cron channel not found",
      });
    }

    if (cronChannels.length > 1) {
      throw new HTTPException(400, {
        message: "Multiple cron channels found",
      });
    }

    const executions: {
      id: string;
      datetime: Date;
      slug: string;
    }[] = [];

    const cronChannel = cronChannels?.[0];

    if (cronChannel) {
      const messages = await broadcastChannelApi.messageFind({
        id: cronChannel.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (messages?.length) {
        for (const message of messages) {
          const messageData = JSON.parse(message.payload);

          const execution = {
            id: message.id,
            datetime: new Date(messageData.datetime),
            slug: messageData.slug,
          };

          executions.push(execution);
        }
      }
    }

    if (agents?.length) {
      for (const agent of agents) {
        const currentAgentExecutions = executions
          .filter((execution) => execution.slug === agent.slug)
          .sort((a, b) => {
            return a.datetime.getTime() - b.datetime.getTime();
          });

        let lastExecutionTime: Date | null = null;

        if (currentAgentExecutions.length) {
          lastExecutionTime = new Date(currentAgentExecutions[0].datetime);
        }

        const intervalExpression = agent.interval;

        if (!intervalExpression) {
          continue;
        }

        const now = new Date();
        let needToExecute = false;

        if (!lastExecutionTime) {
          needToExecute = true;
        } else {
          try {
            const interval = cronParser.parseExpression(intervalExpression, {
              currentDate: lastExecutionTime || now,
            });

            const nextExecutionTime = interval.next().toDate();

            if (now >= nextExecutionTime) {
              needToExecute = true;
            }
          } catch (err) {
            throw new HTTPException(400, {
              message: "Invalid cron expression",
            });
          }
        }

        if (!needToExecute) {
          continue;
        }

        (async () => {
          if (!RBAC_SECRET_KEY) {
            throw new HTTPException(400, {
              message: "RBAC_SECRET not set",
            });
          }

          const agentExecutionResult = await fetch(
            BACKEND_URL + "/api/agent/agents/" + agent.slug,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          ).then((res) => {
            return res.json();
          });

          for (const currentAgentExecution of currentAgentExecutions) {
            await broadcastChannelApi.messageDelete({
              id: currentAgentExecution.id,
              messageId: currentAgentExecution.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }

          await broadcastChannelApi.pushMessage({
            data: {
              channelName: "cron",
              payload: JSON.stringify({
                datetime: new Date().toISOString(),
                slug: agent.slug,
                result: agentExecutionResult,
              }),
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        })();
      }
    }

    return c.json({
      data: { ok: true },
    });
  }
}

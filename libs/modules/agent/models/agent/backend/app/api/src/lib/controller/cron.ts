import {
  AGENT_MAX_DURATION_IN_SECONDS,
  BACKEND_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api } from "@sps/agent/models/agent/sdk/server";
import { IModel as IAgentAgent } from "@sps/agent/models/agent/sdk/model";
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
      result?: any;
    }[] = [];

    const cronChannel = cronChannels?.[0];

    if (cronChannel) {
      const messages = await broadcastChannelApi.messageFind({
        id: cronChannel.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-cache",
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
            result: messageData.result,
          };

          executions.push(execution);
        }
      }
    }

    const executingAgents: IAgentAgent[] = [];

    if (agents?.length) {
      for (const agent of agents) {
        const currentAgentExecutions = executions
          .filter((execution) => execution.slug === agent.slug)
          .sort((a, b) => {
            return b.datetime.getTime() - a.datetime.getTime();
          });

        const lastExecution = currentAgentExecutions?.[0];

        let lastExecutionTime: Date | null = null;

        if (lastExecution) {
          lastExecutionTime = new Date(lastExecution.datetime);

          const youngerThanMaxDurationTimestamp =
            lastExecutionTime.getTime() >
            new Date().getTime() - AGENT_MAX_DURATION_IN_SECONDS * 1000;

          if (!lastExecution.result && youngerThanMaxDurationTimestamp) {
            continue;
          }
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

        executingAgents.push(agent);

        (async () => {
          if (!RBAC_SECRET_KEY) {
            throw new HTTPException(400, {
              message: "RBAC_SECRET not set",
            });
          }

          for (const currentAgentExecution of currentAgentExecutions) {
            await broadcastChannelApi
              .messageDelete({
                id: cronChannel.id,
                messageId: currentAgentExecution.id,
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              })
              .catch((error) => {
                //
              });
          }

          await broadcastChannelApi.pushMessage({
            data: {
              slug: "cron",
              payload: JSON.stringify({
                datetime: new Date().toISOString(),
                slug: agent.slug,
              }),
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

          const agentExecutionResult = await fetch(
            BACKEND_URL + "/api/agent/agents/" + agent.slug,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          )
            .then((res) => {
              return res.json();
            })
            .catch((error) => {
              return {
                error: error?.message || "Unknown error",
              };
            });

          await broadcastChannelApi.pushMessage({
            data: {
              slug: "cron",
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
      data: executingAgents,
    });
  }
}

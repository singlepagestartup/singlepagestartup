import {
  AGENT_MAX_DURATION_IN_SECONDS,
  API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api } from "@sps/agent/models/agent/sdk/server";
import { IModel as IAgentAgent } from "@sps/agent/models/agent/sdk/model";
import cronParser from "cron-parser";
import { logger } from "@sps/backend-utils";

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

      const [agents, cronChannels] = await Promise.all([
        api.find({
          options: {
            headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
          },
        }),
        broadcastChannelApi.find({
          params: {
            filters: {
              and: [{ column: "title", method: "eq", value: "cron" }],
            },
          },
        }),
      ]);

      if (!cronChannels || cronChannels.length !== 1) {
        throw new Error("Invalid cron channel configuration");
      }

      const cronChannel = cronChannels[0];

      const messages = await broadcastChannelApi.messageFind({
        id: cronChannel.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      const executions =
        messages?.map((message) => ({
          id: message.id,
          datetime: new Date(JSON.parse(message.payload).datetime),
          slug: JSON.parse(message.payload).slug,
          result: JSON.parse(message.payload).result,
        })) || [];

      const executingAgents: IAgentAgent[] = [];

      const tasks = agents?.map(async (agent) => {
        try {
          const currentExecutions = executions
            .filter((execution) => execution.slug === agent.slug)
            .sort((a, b) => b.datetime.getTime() - a.datetime.getTime());

          const lastExecution = currentExecutions[0];

          let lastExecutionTime: Date | null = lastExecution
            ? new Date(lastExecution.datetime)
            : null;
          const youngerThanMaxDuration =
            lastExecutionTime &&
            lastExecutionTime.getTime() >
              new Date().getTime() - AGENT_MAX_DURATION_IN_SECONDS * 1000;

          if (
            lastExecution &&
            !lastExecution.result &&
            youngerThanMaxDuration
          ) {
            return;
          }

          if (!agent.interval) {
            return;
          }

          const now = new Date();
          let needToExecute = false;

          try {
            const interval = cronParser.parseExpression(agent.interval, {
              currentDate: lastExecutionTime || now,
            });
            const nextExecutionTime = interval.next().toDate();
            if (now >= nextExecutionTime) {
              needToExecute = true;
            }
          } catch (err) {
            logger.error(
              `❌ Invalid cron expression for agent ${agent.slug}:`,
              err,
            );
            return;
          }

          if (!needToExecute) return;

          executingAgents.push(agent);

          await this.executeCronTask(agent, cronChannel, currentExecutions);
        } catch (err) {
          logger.error(`❌ An error during agent '${agent.slug}':`, err);
        }
      });

      if (tasks) {
        await Promise.allSettled(tasks);
      }

      return c.json({ data: executingAgents });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }

  async executeCronTask(
    agent: IAgentAgent,
    cronChannel: any,
    currentExecutions: any[],
  ) {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      await Promise.allSettled(
        currentExecutions.map(async (execution) => {
          try {
            if (!RBAC_SECRET_KEY) {
              throw new Error("RBAC_SECRET_KEY not set");
            }

            await broadcastChannelApi.messageDelete({
              id: cronChannel.id,
              messageId: execution.id,
              options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
            });
          } catch (error) {
            logger.error(
              `❌ Error during deleting message ${execution.id}:`,
              error,
            );
          }
        }),
      );

      await broadcastChannelApi.pushMessage({
        data: {
          slug: "cron",
          payload: JSON.stringify({
            datetime: new Date().toISOString(),
            slug: agent.slug,
          }),
        },
        options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
      });

      const agentExecutionResult = await fetch(
        API_SERVICE_URL + "/api/agent/agents/" + agent.slug,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      )
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Ошибка запроса: ${res.status} - ${errorText}`);
          }
          return res.json();
        })
        .catch((error) => {
          logger.error(`❌ Error during agent '${agent.slug}':`, error);
          return { error: error?.message || "Unknown error" };
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
        options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
      });
    } catch (error) {
      logger.error(
        `❌ Error durng executeCronTask for agent '${agent.slug}':`,
        error,
      );
    }
  }
}

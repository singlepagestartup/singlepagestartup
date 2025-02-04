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
      throw new HTTPException(400, {
        message: "Invalid cron channel configuration",
      });
    }

    const cronChannel = cronChannels[0];

    const messages = await broadcastChannelApi.messageFind({
      id: cronChannel.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-cache",
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

      if (lastExecution && !lastExecution.result && youngerThanMaxDuration) {
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
        throw new HTTPException(400, { message: "Invalid cron expression" });
      }

      if (!needToExecute) return;

      executingAgents.push(agent);

      (async () => {
        if (!RBAC_SECRET_KEY) {
          throw new HTTPException(400, {
            message: "RBAC_SECRET_KEY not set",
          });
        }

        await Promise.allSettled(
          currentExecutions.map((execution) => {
            if (!RBAC_SECRET_KEY) {
              throw new HTTPException(400, {
                message: "RBAC_SECRET_KEY not set",
              });
            }

            broadcastChannelApi
              .messageDelete({
                id: cronChannel.id,
                messageId: execution.id,
                options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
              })
              .catch(() => {});
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
          BACKEND_URL + "/api/agent/agents/" + agent.slug,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        )
          .then((res) => res.json())
          .catch((error) => ({ error: error?.message || "Unknown error" }));

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
      })();
    });

    if (tasks) {
      await Promise.allSettled(tasks);
    }

    return c.json({ data: executingAgents });
  }
}

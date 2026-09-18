import {
  AGENT_CRON_MAX_CONCURRENCY,
  RBAC_SECRET_KEY,
  limitedParallelExecution,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { IModel as IAgentAgent } from "@sps/agent/models/agent/sdk/model";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import {
  type IAgentRunDispatch,
  type IAgentRunMarker,
} from "../../service/singlepage/agent-run";

export interface IDueAgent {
  agent: IAgentAgent;
  markers: IAgentRunMarker[];
  supersedes?: string;
}

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const channel = await this.service.agentRun.findChannel();

      const [agents, markers] = await Promise.all([
        this.service.find(),
        this.service.agentRun.findMarkers({ channel }),
      ]);

      const now = new Date();
      const dueAgents: IDueAgent[] = [];

      for (const agent of agents || []) {
        const agentMarkers = markers.filter(
          (marker) => marker.slug === agent.slug,
        );
        const decision = this.service.agentRun.isDue({
          agent,
          marker: agentMarkers[0],
          now,
        });

        if (!decision.due) {
          continue;
        }

        dueAgents.push({
          agent,
          markers: agentMarkers,
          supersedes: decision.supersedes,
        });
      }

      await limitedParallelExecution<IAgentRunDispatch | null>(
        dueAgents.map((dueAgent) => async () => {
          try {
            return await this.service.agentRun.dispatch({
              agent: dueAgent.agent,
              supersedes: dueAgent.supersedes,
              channel,
              previousMarkers: dueAgent.markers,
            });
          } catch (error) {
            logger.error(
              `❌ An error during agent '${dueAgent.agent.slug}':`,
              error,
            );

            return null;
          }
        }),
        AGENT_CRON_MAX_CONCURRENCY,
      );

      return c.json({ data: dueAgents.map((dueAgent) => dueAgent.agent) });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

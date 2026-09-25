import { randomUUID } from "node:crypto";
import {
  AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS,
  AGENT_MAX_DURATION_IN_SECONDS,
  API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import {
  IModel as IAgentAgent,
  route,
  runIdHeader,
} from "@sps/agent/models/agent/sdk/model";
import cronParser from "cron-parser";
import { logger } from "@sps/backend-utils";
import { type IBroadcastModule } from "../../di";

export const cronChannelSlug = "cron";
export const defaultMarkerLifetimeInSeconds = 3600;

export interface IAgentRunChannel {
  id: string;
}

export interface IAgentRunMarker {
  id: string;
  slug: string;
  datetime: Date;
  runId?: string;
  supersedes?: string;
  result?: Record<string, unknown>;
}

export type IAgentRunDecisionReason =
  | "running"
  | "no-interval"
  | "first-run"
  | "scheduled"
  | "stale-run"
  | "not-scheduled"
  | "invalid-interval";

export interface IAgentRunDecision {
  due: boolean;
  reason: IAgentRunDecisionReason;
  supersedes?: string;
}

export type IAgentRunDispatchStatus = "finished" | "left-running" | "failed";

export interface IAgentRunDispatch {
  slug: string;
  runId: string;
  status: IAgentRunDispatchStatus;
  error?: string;
}

export interface IAgentRunProps {
  broadcastModule: IBroadcastModule;
}

/**
 * Owns the lifecycle of one scheduled agent execution.
 *
 * A run is a pair of Broadcast messages on the `cron` channel: a running marker
 * written before the dispatch and a finished marker written by the side that
 * observed the outcome. The cron runner never records a result for a handler it
 * did not see finish; the handler closes its own run through the agent-run
 * route middleware.
 */
export class AgentRun {
  broadcastModule: IBroadcastModule;

  constructor(props: IAgentRunProps) {
    this.broadcastModule = props.broadcastModule;
  }

  async findChannel(): Promise<IAgentRunChannel> {
    const channels = await this.broadcastModule.channel.find({
      params: {
        filters: {
          and: [{ column: "slug", method: "eq", value: cronChannelSlug }],
        },
      },
    });

    if (!channels || channels.length !== 1) {
      throw new Error("Validation error. Invalid cron channel configuration");
    }

    return channels[0];
  }

  async findMarkers(props?: {
    channel?: IAgentRunChannel;
  }): Promise<IAgentRunMarker[]> {
    const channel = props?.channel || (await this.findChannel());

    const channelsToMessages =
      await this.broadcastModule.channelsToMessages.find({
        params: {
          filters: {
            and: [{ column: "channelId", method: "eq", value: channel.id }],
          },
        },
      });

    if (!channelsToMessages?.length) {
      return [];
    }

    const messages = await this.broadcastModule.message.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: Array.from(
                new Set(channelsToMessages.map((item: any) => item.messageId)),
              ),
            },
          ],
        },
      },
    });

    const markers: IAgentRunMarker[] = [];

    for (const message of messages || []) {
      try {
        const payload = JSON.parse(message.payload);

        markers.push({
          id: message.id,
          slug: payload.slug,
          datetime: new Date(payload.datetime),
          runId: payload.runId,
          supersedes: payload.supersedes,
          result: payload.result,
        });
      } catch (error) {
        logger.error(
          `❌ Invalid cron marker payload in message ${message.id}:`,
          error,
        );
      }
    }

    return this.sortMarkers(markers);
  }

  async getLatestMarker(props: {
    slug: string;
    markers?: IAgentRunMarker[];
  }): Promise<IAgentRunMarker | undefined> {
    const markers = props.markers || (await this.findMarkers());

    return this.sortMarkers(
      markers.filter((marker) => marker.slug === props.slug),
    )[0];
  }

  isDue(props: {
    agent: IAgentAgent;
    marker?: IAgentRunMarker;
    now?: Date;
  }): IAgentRunDecision {
    const { agent, marker } = props;
    const now = props.now || new Date();
    const running = marker ? !marker.result : false;

    if (
      marker &&
      running &&
      marker.datetime.getTime() >
        now.getTime() - AGENT_MAX_DURATION_IN_SECONDS * 1000
    ) {
      return { due: false, reason: "running" };
    }

    if (!agent.interval) {
      return { due: false, reason: "no-interval" };
    }

    if (!marker) {
      return { due: true, reason: "first-run" };
    }

    let nextExecutionTime: Date;

    try {
      nextExecutionTime = cronParser
        .parseExpression(agent.interval, { currentDate: marker.datetime })
        .next()
        .toDate();
    } catch (error) {
      logger.error(
        `❌ Invalid cron expression for agent ${agent.slug}:`,
        error,
      );

      return { due: false, reason: "invalid-interval" };
    }

    if (now < nextExecutionTime) {
      return { due: false, reason: "not-scheduled" };
    }

    if (running) {
      return { due: true, reason: "stale-run", supersedes: marker.runId };
    }

    return { due: true, reason: "scheduled" };
  }

  async markRunning(props: {
    slug: string;
    runId: string;
    supersedes?: string;
    channel?: IAgentRunChannel;
    previousMarkers?: IAgentRunMarker[];
  }): Promise<void> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const channel = props.channel || (await this.findChannel());
    const previousMarkers =
      props.previousMarkers ||
      (await this.findMarkers({ channel })).filter(
        (marker) => marker.slug === props.slug,
      );

    await Promise.allSettled(
      previousMarkers.map(async (marker) => {
        try {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          await broadcastChannelApi.messageDelete({
            id: channel.id,
            messageId: marker.id,
            options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
          });
        } catch (error) {
          logger.error(`❌ Error during deleting message ${marker.id}:`, error);
        }
      }),
    );

    await this.pushMarker({
      payload: {
        datetime: new Date().toISOString(),
        slug: props.slug,
        runId: props.runId,
        ...(props.supersedes ? { supersedes: props.supersedes } : {}),
      },
    });
  }

  async markFinished(props: {
    slug: string;
    runId: string;
    result: Record<string, unknown>;
  }): Promise<boolean> {
    const latest = await this.getLatestMarker({ slug: props.slug });

    if (!latest || latest.runId !== props.runId || latest.result) {
      logger.info(
        `Agent run '${props.runId}' of '${props.slug}' no longer owns the slug, its result is not recorded`,
      );

      return false;
    }

    await this.pushMarker({
      payload: {
        datetime: new Date().toISOString(),
        slug: props.slug,
        runId: props.runId,
        result: props.result,
      },
    });

    return true;
  }

  async isRunSuperseded(props: {
    slug: string;
    runId: string;
  }): Promise<boolean> {
    const latest = await this.getLatestMarker({ slug: props.slug });

    return !!latest && latest.runId !== props.runId;
  }

  async dispatch(props: {
    agent: IAgentAgent;
    runId?: string;
    supersedes?: string;
    channel?: IAgentRunChannel;
    previousMarkers?: IAgentRunMarker[];
  }): Promise<IAgentRunDispatch> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const slug = props.agent.slug;
    const runId = props.runId || randomUUID();

    await this.markRunning({
      slug,
      runId,
      supersedes: props.supersedes,
      channel: props.channel,
      previousMarkers: props.previousMarkers,
    });

    try {
      const res = await fetch(`${API_SERVICE_URL}${route}/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          [runIdHeader]: runId,
        },
        signal: AbortSignal.timeout(
          AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS * 1000,
        ),
      });

      if (res.ok) {
        return { slug, runId, status: "finished" };
      }

      return await this.failDispatch({
        slug,
        runId,
        error: `Internal error. Error request: ${res.status}`,
      });
    } catch (error: any) {
      if (this.isDispatchHandoff(error)) {
        return { slug, runId, status: "left-running" };
      }

      return await this.failDispatch({
        slug,
        runId,
        error: error?.message || "Unknown error",
      });
    }
  }

  /**
   * The dispatch window closes while the handler is still working. The request
   * is abandoned on purpose, the handler keeps running and closes its own run.
   */
  protected isDispatchHandoff(error: any): boolean {
    return error?.name === "AbortError" || error?.name === "TimeoutError";
  }

  protected async failDispatch(props: {
    slug: string;
    runId: string;
    error: string;
  }): Promise<IAgentRunDispatch> {
    logger.error(`❌ Error during agent '${props.slug}':`, props.error);

    await this.markFinished({
      slug: props.slug,
      runId: props.runId,
      result: { error: props.error },
    });

    return {
      slug: props.slug,
      runId: props.runId,
      status: "failed",
      error: props.error,
    };
  }

  protected markerExpiresAt(props?: { now?: Date }): string {
    const now = props?.now || new Date();
    const lifetimeInSeconds = Math.max(
      defaultMarkerLifetimeInSeconds,
      AGENT_MAX_DURATION_IN_SECONDS,
    );

    return new Date(now.getTime() + lifetimeInSeconds * 1000).toISOString();
  }

  protected sortMarkers(markers: IAgentRunMarker[]): IAgentRunMarker[] {
    return [...markers].sort(
      (a, b) => b.datetime.getTime() - a.datetime.getTime(),
    );
  }

  protected async pushMarker(props: {
    payload: Record<string, unknown>;
  }): Promise<void> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    await broadcastChannelApi.pushMessage({
      data: {
        slug: cronChannelSlug,
        expiresAt: this.markerExpiresAt(),
        payload: JSON.stringify(props.payload),
      },
      options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
    });
  }
}

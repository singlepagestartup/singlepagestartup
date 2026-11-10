import {
  AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS,
  AGENT_CRON_CHANNEL_SLUG,
  AGENT_MAX_DURATION_IN_SECONDS,
  API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import {
  IModel as IAgentAgent,
  route,
  runIdHeader,
} from "@sps/agent/models/agent/sdk/model";
import cronParser from "cron-parser";
import { logger } from "@sps/backend-utils";
import { type IBroadcastModule } from "../../../di";

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

export interface IAgentRunClaim {
  agent: IAgentAgent;
  runId: string;
  supersedes?: string;
}

export interface IAgentRunProps {
  broadcastModule: IBroadcastModule;
}

/**
 * Owns the lifecycle of one scheduled agent execution.
 *
 * Broadcast owns delivery. The handler acknowledges the message after its work finishes.
 */
export class AgentRun {
  broadcastModule: IBroadcastModule;

  get queue() {
    return this.broadcastModule.channel.queue;
  }

  constructor(props: IAgentRunProps) {
    this.broadcastModule = props.broadcastModule;
  }

  async findChannel(): Promise<IAgentRunChannel> {
    const channels = await this.broadcastModule.channel.find({
      params: {
        filters: {
          and: [
            { column: "slug", method: "eq", value: AGENT_CRON_CHANNEL_SLUG },
          ],
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

    const messages =
      await this.broadcastModule.channel.transientChannelMessages(channel.id);

    const markers: IAgentRunMarker[] = [];

    for (const message of messages || []) {
      try {
        const payload = JSON.parse(message.payload);

        const datetime = new Date(payload.datetime);
        if (
          typeof payload.slug !== "string" ||
          !Number.isFinite(datetime.getTime())
        ) {
          throw new Error("A cron marker requires a slug and timestamp");
        }
        markers.push({
          id: message.id,
          slug: payload.slug,
          datetime,
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

  isDue(props: {
    agent: IAgentAgent;
    marker?: Pick<IAgentRunMarker, "datetime" | "result" | "runId">;
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

    let nextExecutionTime: Date;

    try {
      nextExecutionTime = cronParser
        .parseExpression(agent.interval, {
          currentDate: marker?.datetime || now,
        })
        .next()
        .toDate();
    } catch (error) {
      logger.error(
        `❌ Invalid cron expression for agent ${agent.slug}:`,
        error,
      );

      return { due: false, reason: "invalid-interval" };
    }

    if (!marker) {
      return { due: true, reason: "first-run" };
    }

    if (now < nextExecutionTime) {
      return { due: false, reason: "not-scheduled" };
    }

    if (running) {
      return { due: true, reason: "stale-run", supersedes: marker.runId };
    }

    return { due: true, reason: "scheduled" };
  }

  private async owner(slug: string, receipt: string) {
    const channel = await this.findChannel();
    return { channelId: channel.id, key: slug, receipt };
  }

  async markFinished(props: {
    slug: string;
    runId: string;
    result: Record<string, unknown>;
    pendingOnly?: boolean;
  }) {
    const owner = await this.owner(props.slug, props.runId);
    const payload = JSON.stringify({
      slug: props.slug,
      runId: props.runId,
      datetime: new Date().toISOString(),
      result: props.result,
    });
    return this.queue.acknowledge(owner, payload, props.pendingOnly);
  }

  async startHandler(props: { slug: string; runId: string }) {
    const owner = await this.owner(props.slug, props.runId);
    if (!(await this.queue.start(owner))) {
      return;
    }

    // Renew only while the handler actually runs. An API crash stops renewal.
    let renewing = false;
    const heartbeatIntervalMs = Math.min(
      30_000,
      Math.max(100, (AGENT_MAX_DURATION_IN_SECONDS * 1000) / 3),
    );
    const timer = setInterval(async () => {
      if (renewing) {
        return;
      }

      renewing = true;
      try {
        await this.queue.renew(owner, AGENT_MAX_DURATION_IN_SECONDS);
      } catch (error) {
        logger.error(`Failed to renew scheduled agent '${owner.key}'`, error);
      } finally {
        renewing = false;
      }
    }, heartbeatIntervalMs);
    timer.unref();
    return () => clearInterval(timer);
  }

  async isRunSuperseded(props: {
    slug: string;
    runId: string;
  }): Promise<boolean> {
    const owner = await this.owner(props.slug, props.runId);
    const ownsDelivery = await this.queue.owns(owner);

    return !ownsDelivery;
  }

  async dispatch(props: IAgentRunClaim): Promise<IAgentRunDispatch> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const slug = props.agent.slug;
    const runId = props.runId;

    try {
      if (!slug || slug === "." || slug === ".." || slug === "cron") {
        throw new Error("Invalid agent route");
      }

      const res = await fetch(
        `${API_SERVICE_URL}${route}/${encodeURIComponent(slug)}`,
        {
          redirect: "error",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            [runIdHeader]: runId,
          },
          signal: AbortSignal.timeout(
            AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS * 1000,
          ),
        },
      );

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
      pendingOnly: true,
    });

    return {
      slug: props.slug,
      runId: props.runId,
      status: "failed",
      error: props.error,
    };
  }

  protected sortMarkers(markers: IAgentRunMarker[]): IAgentRunMarker[] {
    return [...markers].sort(
      (a, b) => b.datetime.getTime() - a.datetime.getTime(),
    );
  }
}

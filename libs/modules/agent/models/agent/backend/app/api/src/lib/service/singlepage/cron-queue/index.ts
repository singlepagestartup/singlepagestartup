import { randomUUID } from "node:crypto";
import {
  AGENT_CRON_MAX_CONCURRENCY,
  AGENT_MAX_DURATION_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import type {
  IDeliveryState,
  ISelection,
} from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage/delivery-queue";
import type { IModel as IAgent } from "@sps/agent/models/agent/sdk/model";
import type { Repository } from "../../../repository";
import type { AgentRun, IAgentRunClaim, IAgentRunMarker } from "../agent-run";

export class CronQueue {
  constructor(
    private readonly repository: Repository,
    private readonly runs: AgentRun,
  ) {}

  async tick() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }
    const agents = (await this.repository.find()).filter(
      (agent) => agent.interval,
    );
    if (!agents.length) {
      return;
    }

    const channel = await this.runs.findChannel();
    const bySlug = new Map<string, IAgent>(
      agents.map((agent) => [agent.slug, agent]),
    );
    const keys = Array.from(bySlug.keys());
    await this.publishMissing(channel.id, keys);
    const attempted = new Set<string>();
    let cutoff: Date | undefined;

    const reserve = () =>
      this.runs.queue.reserve({
        channelId: channel.id,
        concurrency: AGENT_CRON_MAX_CONCURRENCY,
        leaseSeconds: AGENT_MAX_DURATION_IN_SECONDS,
        schedule: {
          keys,
          select: (states, now) => {
            cutoff ??= now;
            return this.due(states, bySlug, attempted, cutoff);
          },
        },
      });

    let batch = await reserve();
    while (batch.length > 0) {
      const dispatches: Promise<void>[] = [];
      for (const delivery of batch) {
        const agent = bySlug.get(delivery.key);
        if (!agent) {
          continue;
        }
        attempted.add(delivery.key);
        dispatches.push(this.dispatch({ agent, runId: delivery.receipt }));
      }
      await Promise.all(dispatches);
      batch = await reserve();
    }
  }

  private async publishMissing(channelId: string, keys: string[]) {
    const states = await this.runs.queue.states(channelId, keys);
    const existing = new Set(states.map((state) => state.key));
    const missing = keys.filter((key) => !existing.has(key));
    if (!missing.length) {
      return;
    }

    const markers = await this.runs.findMarkers({ channel: { id: channelId } });
    const latest = new Map<string, IAgentRunMarker>();
    for (const marker of markers) {
      if (!latest.has(marker.slug)) {
        latest.set(marker.slug, marker);
      }
    }
    for (const key of missing) {
      const marker = latest.get(key);
      const previous = marker
        ? {
            receipt: marker.runId ?? randomUUID(),
            claimedAt: marker.datetime,
            startedAt: marker.datetime,
            leaseUntil: marker.result
              ? null
              : new Date(
                  marker.datetime.getTime() +
                    AGENT_MAX_DURATION_IN_SECONDS * 1000,
                ),
            finishedAt: marker.result ? marker.datetime : null,
          }
        : undefined;
      await this.runs.queue.publish({
        channelId,
        key,
        announce: true,
        payload: JSON.stringify(marker ?? { slug: key }),
        previous,
      });
    }
  }

  private due(
    states: IDeliveryState[],
    agents: Map<string, IAgent>,
    attempted: Set<string>,
    now: Date,
  ) {
    const due: Array<ISelection & { lastRun: number }> = [];
    for (const state of states) {
      if (!state.key || attempted.has(state.key)) {
        continue;
      }
      const agent = agents.get(state.key);
      if (!agent) {
        continue;
      }
      if (state.leaseUntil && state.leaseUntil > now) {
        continue;
      }

      const datetime = state.finishedAt ?? state.claimedAt;
      const marker = datetime
        ? {
            datetime,
            runId: state.receipt ?? undefined,
            result: state.finishedAt ? {} : undefined,
          }
        : undefined;
      const decision = this.runs.isDue({ agent, marker, now });
      if (!decision.due) {
        continue;
      }

      due.push({
        key: agent.slug,
        previous: state.receipt,
        lastRun: datetime?.getTime() ?? 0,
        payload: (receipt: string) =>
          JSON.stringify({
            slug: agent.slug,
            runId: receipt,
            datetime: new Date().toISOString(),
            supersedes: decision.supersedes,
          }),
      });
    }
    return due.sort(
      (a, b) => a.lastRun - b.lastRun || a.key.localeCompare(b.key),
    );
  }

  private async dispatch(claim: IAgentRunClaim) {
    try {
      await this.runs.dispatch(claim);
    } catch (error) {
      logger.error(
        `Error dispatching scheduled agent '${claim.agent.slug}'`,
        error,
      );
    }
  }
}

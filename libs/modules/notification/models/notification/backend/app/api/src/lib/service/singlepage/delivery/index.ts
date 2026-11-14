import { createHash } from "node:crypto";
import { GrammyError, type Transformer } from "grammy";
import type { IBroadcastModule } from "../../../di";
import type { Service as NotificationService } from "..";
import {
  DeliveryDeferredError,
  logger,
  getHttpErrorType,
} from "@sps/backend-utils";
import { NOTIFICATION_MODULE_NOTIFICATION_EXPIRATION_TIMEOUT } from "@sps/shared-utils";

interface IProgress {
  failures: number;
  nextAt: number;
  complete: boolean;
  parts: Record<string, unknown>;
  contentHash?: string;
}

interface IEmailReceipt {
  MessageId?: string;
}

export interface IDeliveryProgress {
  verifyContent: (content: string) => Promise<void>;
  telegram: Transformer;
  email: (send: () => Promise<IEmailReceipt>) => Promise<IEmailReceipt>;
}

export class Service {
  constructor(
    private readonly notifications: NotificationService,
    private readonly broadcast: IBroadcastModule,
  ) {}

  async execute(id: string) {
    const queue = this.broadcast.channel.queue;
    const channel = await this.channel();
    const key = id;
    await queue.publish({
      channelId: channel.id,
      key,
      payload: "{}",
      announce: false,
    });
    const jobs = await queue.reserve({
      channelId: channel.id,
      concurrency: 10,
      leaseSeconds: 120,
      schedule: {
        keys: [key],
        select: (states, now) => {
          const state = states[0];
          if (!state || (state.leaseUntil && state.leaseUntil > now)) {
            return [];
          }
          const progress = JSON.parse(state.payload) as Partial<IProgress>;
          if (progress.complete || (progress.nextAt ?? 0) > now.getTime()) {
            return [];
          }
          return [{ key, previous: state.receipt }];
        },
      },
    });
    const job = jobs[0];
    if (!job || !(await queue.start(job))) {
      return this.notifications.findById({ id });
    }
    const progress: IProgress = {
      failures: 0,
      nextAt: 0,
      complete: false,
      parts: {},
      ...JSON.parse(job.payload),
    };
    let partIndex = 0;
    const deadline = Date.now() + 25000;
    const perform = async <T>(
      partKey: string,
      send: () => Promise<T>,
    ): Promise<T> => {
      if (Object.hasOwn(progress.parts, partKey)) {
        return progress.parts[partKey] as T;
      }
      if (Date.now() >= deadline) {
        throw new DeliveryDeferredError(Date.now() + 1000);
      }
      if (!(await queue.renew(job, 120))) {
        throw new Error("Conflict error. Notification delivery lease was lost");
      }
      const result = await send();
      progress.parts[partKey] = result;
      if (!(await queue.checkpoint(job, JSON.stringify(progress)))) {
        throw new Error(
          "Conflict error. Notification delivery checkpoint was lost",
        );
      }
      return result;
    };
    const delivery: IDeliveryProgress = {
      verifyContent: async (content) => {
        const contentHash = createHash("sha256").update(content).digest("hex");
        if (
          progress.contentHash &&
          progress.contentHash !== contentHash &&
          Object.keys(progress.parts).length > 0
        ) {
          progress.failures = 3;
          throw new Error(
            "Conflict error. A pending notification changed; create a new notification",
          );
        }
        progress.contentHash = contentHash;
        if (!(await queue.checkpoint(job, JSON.stringify(progress)))) {
          throw new Error(
            "Conflict error. Notification delivery lease was lost",
          );
        }
      },
      // The transformer is outside the rate limiter: completed parts neither
      // call Telegram nor consume provider quota during a retry.
      telegram: async (previous, method, payload, signal) => {
        const partKey = String(partIndex);
        const result = await perform(partKey, async () => {
          const response = await previous(method, payload, signal);
          if (!response.ok) {
            // A rejected Telegram operation must not become a completed part.
            throw new GrammyError(
              "Notification delivery rejected",
              response,
              method,
              payload,
            );
          }
          // Store IDs only, not message text, credentials or API response bodies.
          const minimal = (item: { message_id?: number }) => ({
            message_id: item.message_id,
          });
          const result = Array.isArray(response.result)
            ? response.result.map(minimal)
            : minimal(response.result as { message_id?: number });
          return { ok: true as const, result } as typeof response;
        });
        partIndex += 1;
        return result;
      },
      email: (send) =>
        perform("email", async () => {
          const response = await send();
          if (!response.MessageId) {
            throw new Error(
              "Internal error. Email provider did not confirm delivery",
            );
          }
          return { MessageId: response.MessageId };
        }),
    };
    try {
      const result = await this.notifications.sendNow({ id }, delivery);
      if (!result || result.status !== "new") {
        progress.complete = true;
      } else {
        progress.nextAt = new Date(
          result.sendAfter ?? Date.now() + 60000,
        ).getTime();
      }
      return result;
    } catch (error) {
      if (!(await queue.owns(job))) {
        logger.warn({
          event: "notification.delivery.lease-lost",
          notificationId: id,
        });
        return this.notifications.findById({ id });
      }
      if (error instanceof DeliveryDeferredError) {
        progress.nextAt = Math.max(Date.now() + 1000, error.retryAt);
      } else {
        progress.failures = Math.min(3, progress.failures + 1);
        progress.nextAt = Date.now() + progress.failures * 60000;
        progress.complete = progress.failures >= 3;
      }
      logger.warn({
        event: "notification.delivery.deferred",
        category: getHttpErrorType(error).category,
        notificationId: id,
        failures: progress.failures,
        retryAt: progress.nextAt,
        complete: progress.complete,
      });
      const current = await this.notifications.findById({ id });
      if (!current) {
        progress.complete = true;
        return null;
      }
      const result = await this.notifications.update({
        id,
        data: {
          ...current,
          status: progress.complete ? "error" : "new",
          sendAfter: new Date(progress.nextAt),
        },
      });
      return result;
    } finally {
      await queue.acknowledge(job, JSON.stringify(progress));
    }
  }

  async cleanup() {
    const channel = await this.channel();
    const before = new Date(
      Date.now() - NOTIFICATION_MODULE_NOTIFICATION_EXPIRATION_TIMEOUT,
    );
    await this.broadcast.channel.queue.removeExpired(channel.id, before, 100);
  }

  private async channel() {
    const props = {
      params: {
        limit: 1,
        filters: {
          and: [
            {
              column: "slug",
              method: "eq" as const,
              value: "notification-delivery",
            },
          ],
        },
      },
    };
    const existing = await this.broadcast.channel.find(props);
    if (existing?.length) {
      return existing[0];
    }
    try {
      return await this.broadcast.channel.create({
        data: { slug: "notification-delivery", title: "Notification delivery" },
      });
    } catch (error) {
      const created = await this.broadcast.channel.find(props);
      if (created?.length) {
        return created[0];
      }
      throw error;
    }
  }
}

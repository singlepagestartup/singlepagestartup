import "reflect-metadata";
import { inject, injectable } from "inversify";
import { Provider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  SECURITY_NOTIFICATIONS_ENABLED,
  SECURITY_NOTIFICATION_FAILURE_THRESHOLD,
  TELEGRAM_SERVICE_BOT_TOKEN,
  AWS_SES_FROM_EMAIL,
} from "@sps/shared-utils";
import {
  SecurityEvents,
  logger,
  type ISecuritySummary,
} from "@sps/backend-utils";
import {
  SubjectDI,
  type IReadService,
  type IBroadcastModule,
  type INotificationModule,
} from "../../../di";

interface IDelivery {
  start: number;
  attempts: number;
  nextAt: number;
  complete: boolean;
}

interface IRecipient {
  subjectId: string;
  telegram?: string;
  email?: string;
}

// One recurring, private Broadcast message coalesces security events. A new
// window replaces an undelivered old summary; there is no per-request backlog.
@injectable()
export class Service {
  private readonly events = new SecurityEvents(
    new Provider({ type: KV_PROVIDER }),
  );

  constructor(
    @inject(SubjectDI.IRoleService) private readonly role: IReadService,
    @inject(SubjectDI.ISubjectsToRolesService)
    private readonly subjectsToRoles: IReadService,
    @inject(SubjectDI.ISubjectsToIdentitiesService)
    private readonly subjectsToIdentities: IReadService,
    @inject(SubjectDI.IIdentityService) private readonly identity: IReadService,
    @inject(SubjectDI.INotificationModule)
    private readonly notifications: INotificationModule,
    @inject(SubjectDI.IBroadcastModule)
    private readonly broadcast: IBroadcastModule,
  ) {
    if (
      !Number.isSafeInteger(SECURITY_NOTIFICATION_FAILURE_THRESHOLD) ||
      SECURITY_NOTIFICATION_FAILURE_THRESHOLD < 1
    ) {
      throw new Error(
        "Configuration error. Security notification failure threshold must be a positive integer",
      );
    }
  }

  async execute(): Promise<void> {
    if (!SECURITY_NOTIFICATIONS_ENABLED) {
      return;
    }
    try {
      await this.dispatch();
    } catch {
      // The scheduler runs once a minute; never recursively report delivery
      // failures through Notification or prevent the existing order check.
      logger.warn({ event: "security.summary.dispatch-failed" });
    }
  }

  private async dispatch() {
    const window = this.events.window;
    const start = Math.floor(Date.now() / 1000 / window) * window - window;
    const summary = await this.events.read(start);
    if (!summary || !this.shouldNotify(summary)) {
      return;
    }
    const channel = await this.channel();
    const queue = this.broadcast.message.queue;
    const key = "security-summary";
    const existing = await queue.states(channel.id, [key]);
    if (!existing.length) {
      await queue.publish({
        channelId: channel.id,
        key,
        payload: "{}",
        announce: false,
      });
    }
    const jobs = await queue.reserve({
      channelId: channel.id,
      concurrency: 1,
      leaseSeconds: 600,
      schedule: {
        keys: [key],
        select: (states, now) => {
          const state = states.find((item) => item.key === key);
          if (!state || (state.leaseUntil && state.leaseUntil > now)) {
            return [];
          }
          let delivery: IDelivery = {
            start,
            attempts: 0,
            nextAt: 0,
            complete: false,
          };
          const previous = JSON.parse(state.payload) as Partial<IDelivery>;
          // A delayed request from the prior period must not replace newer
          // delivery state or reset that period's retry budget.
          if (typeof previous.start === "number" && previous.start > start) {
            return [];
          }
          if (previous.start === start) {
            delivery = previous as IDelivery;
          }
          if (
            delivery.complete ||
            delivery.attempts >= 3 ||
            delivery.nextAt > now.getTime()
          ) {
            return [];
          }
          delivery.attempts += 1;
          delivery.nextAt = now.getTime() + delivery.attempts * 60000;
          return [
            {
              key,
              previous: state.receipt,
              payload: () => JSON.stringify(delivery),
            },
          ];
        },
      },
    });
    for (const job of jobs) {
      if (!(await queue.start(job))) {
        continue;
      }
      const delivery = JSON.parse(job.payload) as IDelivery;
      try {
        const recipients = await this.recipients();
        let delivered = recipients.length > 0;
        for (const recipient of recipients) {
          // A lost lease must never authorize another external send.
          if (!(await queue.renew(job, 600))) {
            return;
          }
          const result = await this.send(recipient, summary);
          delivered = delivered && result;
        }
        delivery.complete = delivered;
        logger.info({
          event: "security.summary.delivery",
          windowStart: start,
          attempt: delivery.attempts,
          recipients: recipients.length,
          delivered,
        });
      } catch {
        logger.warn({
          event: "security.summary.delivery-failed",
          windowStart: start,
          attempt: delivery.attempts,
        });
      }
      await queue.acknowledge(job, JSON.stringify(delivery));
    }
  }

  private async channel() {
    const props = {
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "slug", method: "eq", value: "security-notifications" },
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
        data: {
          slug: "security-notifications",
          title: "Security notifications",
        },
      });
    } catch (error) {
      // Another API instance may have created the unique slug concurrently.
      const created = await this.broadcast.channel.find(props);
      if (created?.length) {
        return created[0];
      }
      throw error;
    }
  }

  private shouldNotify(summary: ISecuritySummary) {
    if (
      (summary.counts["password-failed"] ?? 0) >=
      SECURITY_NOTIFICATION_FAILURE_THRESHOLD
    ) {
      return true;
    }
    for (const kind of [
      "password-limited",
      "auth-limited",
      "operator-limited",
      "api-limited",
    ] as const) {
      if (summary.counts[kind]) {
        return true;
      }
    }
    return false;
  }

  private async recipients(): Promise<IRecipient[]> {
    const roles = await this.role.find({
      params: {
        limit: 1,
        filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
      },
    });
    if (!roles?.length) {
      return [];
    }
    const assignments = await this.subjectsToRoles.find({
      params: {
        limit: 21,
        orderBy: { and: [{ column: "id", method: "asc" }] },
        filters: {
          and: [{ column: "roleId", method: "eq", value: roles[0].id }],
        },
      },
    });
    if (assignments?.length > 20) {
      logger.warn({ event: "security.summary.recipient-limit", limit: 20 });
    }
    const recipients: IRecipient[] = [];
    const seen = new Set<string>();
    for (const assignment of (assignments ?? []).slice(0, 20)) {
      if (seen.has(assignment.subjectId)) {
        continue;
      }
      seen.add(assignment.subjectId);
      const links = await this.subjectsToIdentities.find({
        params: {
          limit: 20,
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: assignment.subjectId,
              },
            ],
          },
        },
      });
      if (!links?.length) {
        continue;
      }
      const identities = await this.identity.find({
        params: {
          limit: 20,
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: links.map(
                  (link: { identityId: string }) => link.identityId,
                ),
              },
            ],
          },
        },
      });
      const recipient: IRecipient = { subjectId: assignment.subjectId };
      for (const identity of identities ?? []) {
        if (
          TELEGRAM_SERVICE_BOT_TOKEN &&
          identity.provider === "telegram" &&
          /^-?\d+$/.test(identity.account ?? "")
        ) {
          recipient.telegram = identity.account;
        }
        if (AWS_SES_FROM_EMAIL && identity.email) {
          recipient.email = identity.email;
        }
      }
      if (recipient.telegram || recipient.email) {
        recipients.push(recipient);
      }
    }
    return recipients;
  }

  private async send(recipient: IRecipient, summary: ISecuritySummary) {
    const incidentId = `security:${summary.start}`;
    // Both transports share one notification ID, so an earlier successful
    // fallback also prevents a subsequent Telegram retry.
    const channels = ["telegram", "email"] as const;
    for (const method of channels) {
      const receiver = recipient[method];
      if (!receiver) {
        continue;
      }
      const result = await this.notifications.notification.sendSecuritySummary({
        incidentId,
        subjectId: recipient.subjectId,
        method,
        receiver,
        summary,
      });
      if (result.status === "sent") {
        return true;
      }
    }
    return false;
  }
}

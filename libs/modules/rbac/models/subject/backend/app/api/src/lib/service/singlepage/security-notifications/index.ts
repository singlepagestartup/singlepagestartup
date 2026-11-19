import { Provider } from "@sps/providers-kv";
import type { FindServiceProps } from "@sps/shared-backend-api";
import {
  KV_PROVIDER,
  SECURITY_NOTIFICATIONS_ENABLED,
  SECURITY_NOTIFICATION_FAILURE_THRESHOLD,
  TELEGRAM_SERVICE_BOT_TOKEN,
  AWS_SES_FROM_EMAIL,
  BUG_SERVICE_PROJECT,
  securityEventKinds,
  securityNotificationTopicSlug,
  securityNotificationTemplateSlugs,
} from "@sps/shared-utils";
import {
  SecurityEvents,
  getNotificationTemplateChannel,
  logger,
  type ISecuritySummary,
} from "@sps/backend-utils";
import type { SubjectServiceDependencies } from "..";

import {
  renderRequestSchema,
  type IModel as INotificationTemplate,
} from "@sps/notification/models/template/sdk/model";

interface INotificationConfiguration {
  topicId: string;
  templates: Partial<Record<"email" | "telegram", INotificationTemplate>>;
}

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

interface ISecurityNotificationServices {
  role: Pick<SubjectServiceDependencies["module"]["role"], "find">;
  subjectsToRoles: Pick<
    SubjectServiceDependencies["module"]["subjectsToRoles"],
    "find"
  >;
  subjectsToIdentities: Pick<
    SubjectServiceDependencies["module"]["subjectsToIdentities"],
    "find"
  >;
  identity: Pick<SubjectServiceDependencies["module"]["identity"], "find">;
  topic: Pick<
    SubjectServiceDependencies["modules"]["notification"]["topic"],
    "find" | "sendBounded"
  >;
  template: Pick<
    SubjectServiceDependencies["modules"]["notification"]["template"],
    "find"
  >;
  channel: Pick<
    SubjectServiceDependencies["modules"]["broadcast"]["channel"],
    "find" | "create" | "queue"
  >;
}

// One recurring, private Broadcast message coalesces security events. A new
// window replaces an undelivered old summary; there is no per-request backlog.
export class Service {
  private readonly events = new SecurityEvents(
    new Provider({ type: KV_PROVIDER }),
  );

  constructor(private readonly services: ISecurityNotificationServices) {
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
    const configuration = await this.configuration();
    if (!configuration) {
      logger.warn({ event: "security.summary.configuration-missing" });
      return;
    }
    const channel = await this.channel();
    const queue = this.services.channel.queue;
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
          const result = await this.send(recipient, summary, configuration);
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
    const props: FindServiceProps = {
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "slug", method: "eq", value: "security-notifications" },
          ],
        },
      },
    };
    const existing = await this.services.channel.find(props);
    if (existing?.length) {
      return existing[0];
    }
    try {
      return await this.services.channel.create({
        data: {
          slug: "security-notifications",
          title: "Security notifications",
        },
      });
    } catch (error) {
      // Another API instance may have created the unique slug concurrently.
      const created = await this.services.channel.find(props);
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
    const roles = await this.services.role.find({
      params: {
        limit: 1,
        filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
      },
    });
    if (!roles?.length) {
      return [];
    }
    const assignments = await this.services.subjectsToRoles.find({
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
      const links = await this.services.subjectsToIdentities.find({
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
      const identities = await this.services.identity.find({
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
          identity.account &&
          /^-?\d+$/.test(identity.account)
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

  private async configuration(): Promise<INotificationConfiguration | null> {
    const topics = await this.services.topic.find({
      params: {
        limit: 1,
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: securityNotificationTopicSlug,
            },
          ],
        },
      },
    });
    if (!topics?.length) {
      return null;
    }
    const templates = await this.services.template.find({
      params: {
        limit: 2,
        filters: {
          and: [
            {
              column: "slug",
              method: "inArray",
              value: Object.values(securityNotificationTemplateSlugs),
            },
          ],
        },
      },
    });
    const configuration: INotificationConfiguration = {
      topicId: topics[0].id,
      templates: {},
    };
    for (const method of ["telegram", "email"] as const) {
      const template = templates?.find((item: INotificationTemplate) => {
        const rendering = renderRequestSchema.safeParse({
          variant: item.variant,
          template: {
            title: item.title ?? null,
            content: item.content ?? null,
          },
        });
        return (
          rendering.success &&
          item.slug === securityNotificationTemplateSlugs[method] &&
          getNotificationTemplateChannel(item.variant) === method &&
          Boolean(item.title?.trim())
        );
      });
      if (template) {
        configuration.templates[method] = template;
      }
    }
    if (!Object.keys(configuration.templates).length) {
      return null;
    }
    return configuration;
  }

  private async send(
    recipient: IRecipient,
    summary: ISecuritySummary,
    configuration: INotificationConfiguration,
  ) {
    const incidentId = `security:${summary.start}`;
    const counts: Record<string, number> = {};
    for (const kind of securityEventKinds) {
      counts[kind] = summary.counts[kind] ?? 0;
    }
    const data = {
      incidentId,
      project: BUG_SERVICE_PROJECT || "SPS",
      start: new Date(summary.start * 1000).toISOString(),
      end: new Date(summary.end * 1000).toISOString(),
      counts,
    };
    // Both transports share one notification ID and retry budget. Only
    // channels explicitly configured by the administrator are attempted.
    for (const method of ["telegram", "email"] as const) {
      const receiver = recipient[method];
      const template = configuration.templates[method];
      if (!receiver || !template) {
        continue;
      }
      const result = await this.services.topic.sendBounded({
        key: incidentId,
        recipientKey: recipient.subjectId,
        method,
        receiver,
        topicId: configuration.topicId,
        template,
        data,
        expiresAt: (summary.end + 3600) * 1000,
      });
      if (result.status === "sent") {
        return true;
      }
    }
    return false;
  }
}

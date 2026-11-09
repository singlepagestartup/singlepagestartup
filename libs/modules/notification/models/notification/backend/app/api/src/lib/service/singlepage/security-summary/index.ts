import { Repository } from "../../../repository";
import { createHash } from "node:crypto";
import { Bot } from "grammy";
import { CRUDService } from "@sps/shared-backend-api";
import { AWS } from "@sps/shared-third-parties";
import {
  AWS_SES_FROM_EMAIL,
  TELEGRAM_SERVICE_BOT_TOKEN,
  BUG_SERVICE_PROJECT,
  securityEventKinds,
} from "@sps/shared-utils";
import { logger, type ISecuritySummary } from "@sps/backend-utils";
import { Table } from "@sps/notification/models/notification/backend/repository/database";

export interface ISendSecuritySummary {
  incidentId: string;
  subjectId: string;
  method: "email" | "telegram";
  receiver: string;
  summary: ISecuritySummary;
}
export interface ISecurityDeliveryResult {
  id: string;
  status: "sent" | "error";
}

export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  constructor(repository: Repository) {
    super(repository);
  }

  async execute(props: ISendSecuritySummary): Promise<ISecurityDeliveryResult> {
    const digest = createHash("sha256")
      .update(`${props.incidentId}:${props.subjectId}`)
      .digest("hex");
    const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    let notification = await this.findById({ id });
    if (notification?.status === "sent") {
      return { id, status: "sent" };
    }
    const previousAttempts = Number(notification?.data?.attempts) || 0;
    if (previousAttempts >= 3 || Date.now() / 1000 > props.summary.end + 3600) {
      return { id, status: "error" };
    }
    const project = (BUG_SERVICE_PROJECT || "SPS")
      .replace(/[\r\n]/g, " ")
      .slice(0, 100);
    const title = `${project}: authentication security summary`;
    const lines = [
      title,
      `Period: ${new Date(props.summary.start * 1000).toISOString()} — ${new Date(props.summary.end * 1000).toISOString()}`,
      `Incident: ${props.incidentId}`,
    ];
    const counts: ISecuritySummary["counts"] = {};
    for (const kind of securityEventKinds) {
      const count = props.summary.counts[kind];
      if (
        typeof count === "number" &&
        Number.isSafeInteger(count) &&
        count > 0
      ) {
        counts[kind] = count;
        lines.push(`${kind}: ${count}`);
      }
    }
    lines.push(
      "Rate limits are enforced automatically. Review server security logs; these events alone do not prove an account compromise.",
    );
    const data = {
      incidentId: props.incidentId,
      start: props.summary.start,
      end: props.summary.end,
      counts,
      attempts: previousAttempts + 1,
    };
    if (!notification) {
      notification = await this.repository.createSecuritySummary({
        id,
        variant: `security-summary-${props.method}`,
        status: "sending-security",
        title,
        reciever: props.receiver,
        data,
      });
    } else {
      notification = await this.updateDelivery({
        id,
        data: {
          status: "sending-security",
          variant: `security-summary-${props.method}`,
          reciever: props.receiver,
          data,
        },
      });
    }
    if (!notification) {
      throw new Error(
        "Internal error. Security notification disappeared before delivery",
      );
    }
    try {
      const sourceSystemId = await this.deliver(
        props.method,
        props.receiver,
        title,
        lines.join("\n"),
      );
      await this.updateDelivery({
        id,
        data: { data, status: "sent", sourceSystemId },
      });
      return { id, status: "sent" };
    } catch {
      logger.warn({
        event: "security.summary.transport-failed",
        transport: props.method,
        notificationId: id,
      });
      await this.updateDelivery({
        id,
        data: { data, status: "error" },
      });
      return { id, status: "error" };
    }
  }

  private async updateDelivery(props: {
    id: string;
    data: Partial<(typeof Table)["$inferSelect"]>;
  }) {
    return this.repository.updateFirstByField("id", props.id, props.data);
  }

  protected async deliver(
    method: "email" | "telegram",
    receiver: string,
    title: string,
    text: string,
  ): Promise<string> {
    if (method === "telegram") {
      if (!TELEGRAM_SERVICE_BOT_TOKEN || !/^-?\d+$/.test(receiver)) {
        throw new Error(
          "Configuration error. Security Telegram destination is unavailable",
        );
      }
      const bot = new Bot(TELEGRAM_SERVICE_BOT_TOKEN, {
        client: { timeoutSeconds: 5 },
      });
      const result = await bot.api.sendMessage(receiver, text);
      return String(result.message_id);
    }
    if (
      !AWS_SES_FROM_EMAIL ||
      !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(receiver) ||
      /[\r\n]/.test(AWS_SES_FROM_EMAIL)
    ) {
      throw new Error(
        "Configuration error. Security email destination is unavailable",
      );
    }
    const html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    const result = await new AWS().ses.sendEmail({
      to: receiver,
      from: AWS_SES_FROM_EMAIL,
      subject: title,
      html,
      signal: AbortSignal.timeout(5000),
    });
    if (!result.MessageId) {
      throw new Error(
        "Internal error. Security summary was not accepted by the email provider",
      );
    }
    return result.MessageId;
  }
}

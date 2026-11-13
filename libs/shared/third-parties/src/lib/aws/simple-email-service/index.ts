import {
  SESClient,
  SendRawEmailCommand,
  GetSendQuotaCommand,
} from "@aws-sdk/client-ses";
import * as fs from "fs";
import * as path from "path";
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  KV_PROVIDER,
  NOTIFICATION_SES_MESSAGES_PER_SECOND,
  NOTIFICATION_DELIVERY_WAIT_MS,
} from "@sps/shared-utils";

import { Provider } from "@sps/providers-kv";
import { DeliveryRateLimit, DeliveryDeferredError } from "@sps/backend-utils";

interface IQuota {
  version: string;
  rate: number;
  remaining: number;
  resetAt: number;
}

export class Service {
  client: SESClient;
  blockedAttachmentsRecievers = ["@mail.ru", "@inbox.ru", "@vk.com"];

  constructor() {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required",
      );
    }

    this.client = new SESClient({
      region: AWS_REGION,
      maxAttempts: 1,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(props: {
    to: string;
    subject: string;
    html: string;
    from: string;
    filePaths?: string[];
    signal?: AbortSignal;
  }) {
    for (const value of [props.to, props.from, props.subject]) {
      if (/[\r\n\0]/.test(value)) {
        throw new Error(
          "Validation error. Email headers cannot contain line breaks or null characters",
        );
      }
    }
    if (props.to.includes(",") || props.to.includes(";")) {
      throw new Error(
        "Validation error. SES delivery requires one recipient per notification",
      );
    }
    const signal = props.signal ?? AbortSignal.timeout(30000);
    const store = new Provider({ type: KV_PROVIDER });
    const limiter = new DeliveryRateLimit(store);
    // Shared by all credentials/from-addresses in a region, including verification emails.
    const key = `ses:${AWS_REGION}`;
    const quota = await this.quota(store, limiter, key, signal);
    const root = process.cwd();

    const boundary = "BOUNDARY_" + Date.now().toString();

    const attachments: string[] = [];

    if (
      props.filePaths?.length &&
      !this.blockedAttachmentsRecievers.some((domain) =>
        props.to.endsWith(domain),
      )
    ) {
      for (const filePath of props.filePaths) {
        let fileContent;
        if (filePath.startsWith("http")) {
          fileContent = await fetch(filePath, { signal })
            .then((res) => res.arrayBuffer())
            .then((buffer) => Buffer.from(buffer));
        } else {
          fileContent = fs.readFileSync(path.join(root, "public", filePath));
        }

        const fileName = path.basename(filePath);

        attachments.push(
          [
            `--${boundary}`,
            "Content-Type: application/octet-stream",
            "Content-Transfer-Encoding: base64",
            `Content-Disposition: attachment; filename="${fileName}"`,
            "",
            fileContent.toString("base64"),
            "",
          ].join("\r\n"),
        );
      }
    }

    const rawMessage = [
      `From: ${props.from}`,
      `To: ${props.to}`,
      `Subject: ${props.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      props.html,
      "",
      ...attachments,
      `--${boundary}--`,
      "",
    ].join("\r\n");

    try {
      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawMessage),
        },
      });

      await limiter.acquire({
        key,
        intervalMs: Math.ceil(1000 / quota.rate),
        deadline: Date.now() + NOTIFICATION_DELIVERY_WAIT_MS,
        signal,
        allowance: {
          version: quota.version,
          remaining: quota.remaining,
          resetAt: quota.resetAt,
        },
      });

      const result = await this.client.send(command, {
        abortSignal: signal,
      });

      return result;
    } catch (error: any) {
      if (
        error?.name === "Throttling" ||
        error?.name === "ThrottlingException" ||
        error?.$metadata?.httpStatusCode === 429
      ) {
        const daily = String(error.message).includes(
          "Daily message quota exceeded",
        );
        const retryAt = await limiter.pause(key, daily ? 900000 : 60000);
        throw new DeliveryDeferredError(retryAt);
      }
      throw error;
    }
  }

  private async quota(
    store: Provider,
    limiter: DeliveryRateLimit,
    key: string,
    signal: AbortSignal,
  ): Promise<IQuota> {
    const cached = await store.get({ prefix: "notification:ses-quota", key });
    if (cached) {
      const quota = JSON.parse(cached) as IQuota;
      if (quota.resetAt > Date.now()) {
        return quota;
      }
    }
    // SES permits GetSendQuota at most once a second across account clients.
    await limiter.acquire({
      key: `${key}:quota`,
      intervalMs: 1100,
      deadline: Date.now(),
      signal,
    });
    const result = await this.client.send(new GetSendQuotaCommand({}), {
      abortSignal: signal,
    });
    let rate = result.MaxSendRate ?? 0;
    if (
      !Number.isFinite(NOTIFICATION_SES_MESSAGES_PER_SECOND) ||
      NOTIFICATION_SES_MESSAGES_PER_SECOND < 0
    ) {
      throw new Error("Configuration error. Invalid SES notification rate");
    }
    if (NOTIFICATION_SES_MESSAGES_PER_SECOND > 0) {
      rate = Math.min(rate, NOTIFICATION_SES_MESSAGES_PER_SECOND);
    }
    if (
      !Number.isFinite(rate) ||
      rate <= 0 ||
      result.Max24HourSend === undefined ||
      result.SentLast24Hours === undefined
    ) {
      throw new Error("Configuration error. SES sending quota is unavailable");
    }
    let remaining = Math.max(
      0,
      Math.floor(result.Max24HourSend - result.SentLast24Hours),
    );
    if (result.Max24HourSend === -1) {
      remaining = Number.MAX_SAFE_INTEGER;
    }
    const quota = {
      version: String(Date.now()),
      rate,
      remaining,
      resetAt: Date.now() + 60000,
    };
    await store.set({
      prefix: "notification:ses-quota",
      key,
      value: JSON.stringify(quota),
      options: { ttl: 60 },
    });
    return quota;
  }
}

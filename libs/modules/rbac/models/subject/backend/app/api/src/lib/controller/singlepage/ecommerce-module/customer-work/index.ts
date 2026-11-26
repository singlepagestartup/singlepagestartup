import {
  authorization,
  getFileContentHeaders,
  getHttpErrorType,
} from "@sps/backend-utils";
import {
  customerWorkCommandSchema,
  customerWorkOfferScopeSchema,
  customerWorkScopeSchema,
  customerWorkTelegramRateSchema,
} from "@sps/rbac/models/subject/sdk/model";
import { z } from "zod";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../service";

export class Handler {
  constructor(private readonly subject: Service) {}

  async attachment(c: Context) {
    try {
      const scope = z
        .object({
          id: z.uuid(),
          threadId: z.uuid(),
          messageId: z.uuid(),
          attachmentId: z.uuid(),
        })
        .safeParse(c.req.param());
      if (!scope.success) {
        throw new Error("Validation error. Select a message attachment");
      }
      const { id: customerId, threadId, messageId, attachmentId } = scope.data;
      const file = await this.subject.customerWork.attachment({
        customerId,
        threadId,
        messageId,
        attachmentId,
      });
      return messageAttachmentResponse(file, c.req.method);
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async forThread(c: Context) {
    try {
      const scope = z
        .object({ id: z.uuid(), threadId: z.uuid() })
        .safeParse(c.req.param());
      if (!scope.success) {
        throw new Error("Validation error. Select a customer thread");
      }
      const data = await this.subject.customerWork.viewForThread(
        scope.data.id,
        scope.data.threadId,
      );
      c.header("Cache-Control", "private, no-store");
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async approveTelegramRate(c: Context) {
    try {
      const callback = customerWorkTelegramRateSchema.safeParse(
        await c.req.json().catch(() => null),
      );
      if (!callback.success) {
        throw new Error("Validation error. Invalid Telegram rate callback");
      }
      await this.subject.customerWork.approveRateFromTelegram(callback.data);
      c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
      c.header("Cache-Control", "private, no-store");
      return c.body(null, 204);
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async execute(c: Context) {
    try {
      const customerId = c.req.param("id");
      const storeId = c.req.param("storeId");
      if (!customerId || !storeId) {
        throw new Error(
          "Validation error. The customer and store are required",
        );
      }
      c.header("Cache-Control", "private, no-store");
      if (c.req.method === "GET") {
        if (c.req.query("offerId")) {
          const scope = customerWorkOfferScopeSchema.safeParse({
            storeId,
            offerId: c.req.query("offerId"),
            productId: c.req.query("productId"),
          });
          if (!scope.success) {
            throw new Error("Validation error. Select an offer");
          }
          const data = await this.subject.customerWork.availability(scope.data);
          return c.json({ data });
        }
        if (c.req.query("orderId")) {
          const data = await this.subject.customerWork.viewForOrder(
            customerId,
            storeId,
            c.req.query("orderId")!,
          );
          return c.json({ data });
        }
        const scope = customerWorkScopeSchema.safeParse({
          storeId,
          taskId: c.req.query("taskId"),
        });
        if (!scope.success) {
          throw new Error("Validation error. Select a customer task");
        }
        const data = await this.subject.customerWork.view(
          customerId,
          scope.data,
        );
        return c.json({ data });
      }

      const command = customerWorkCommandSchema.safeParse(
        await c.req.json().catch(() => null),
      );
      if (!command.success || command.data.storeId !== storeId) {
        throw new Error("Validation error. Invalid store work request");
      }
      const data = await this.subject.customerWork.execute(
        customerId,
        command.data,
        authorization(c),
      );
      c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
      return c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

export function messageAttachmentResponse(
  file: { name: string; size: number; bytes: Uint8Array },
  method: string,
  contentType = "application/octet-stream",
) {
  const headers = getFileContentHeaders(file.name, contentType);
  headers.set("Content-Type", contentType);
  headers.set("Content-Length", String(file.size));
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "sandbox; default-src 'none'");
  headers.set("Cache-Control", "private, no-store");
  headers.set("Vary", "Authorization, Cookie");
  const filename = encodeURIComponent(file.name).replace(
    /['()*]/g,
    (letter) => `%${letter.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  headers.set(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${filename}`,
  );
  const body = method === "HEAD" ? null : Uint8Array.from(file.bytes);
  return new Response(body, { headers });
}

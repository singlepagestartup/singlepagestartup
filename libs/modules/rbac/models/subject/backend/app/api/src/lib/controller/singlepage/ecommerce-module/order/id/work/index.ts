import { getFileContentHeaders, getHttpErrorType } from "@sps/backend-utils";
import {
  orderWorkDecisionSchema,
  orderWorkFulfillmentSchema,
  orderWorkScopeSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/work";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context) {
    try {
      const actorId = z.uuid().parse(c.get("signedInSubjectId"));
      const orderId = z.uuid().parse(c.req.param("orderId"));
      const artifactId = c.req.param("artifactId");
      if (artifactId && (c.req.method === "GET" || c.req.method === "HEAD")) {
        const file = await this.service.artifact(
          actorId,
          orderId,
          z.uuid().parse(artifactId),
          c.req.method,
          z.uuid().optional().parse(c.req.query("storeId")),
        );
        const headers = getFileContentHeaders(file.name, file.mimeType);
        headers.set("Cache-Control", "private, no-store");
        headers.set("Vary", "Authorization, Cookie");
        headers.set("Content-Type", file.mimeType);
        headers.set("Content-Length", String(file.size));
        headers.set(
          "Content-Disposition",
          `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        );
        const body =
          c.req.method === "HEAD" ? null : Uint8Array.from(file.bytes);
        return new Response(body, { headers });
      }

      c.header("Cache-Control", "private, no-store");
      if (c.req.method === "GET") {
        const scope = orderWorkScopeSchema.parse(c.req.query());
        const data = await this.service.read(actorId, { ...scope, orderId });
        return c.json({ data });
      }
      const raw = await c.req.json().catch(() => null);
      if (c.req.path.replace(/\/$/, "").endsWith("/fulfillment")) {
        const input = orderWorkFulfillmentSchema.parse(raw);
        const data = await this.service.fulfill(actorId, { ...input, orderId });
        return c.json({ data });
      }
      const command = orderWorkDecisionSchema.parse(raw);
      const data = await this.service.decision(actorId, orderId, command);
      return c.json({ data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid order work parameters",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

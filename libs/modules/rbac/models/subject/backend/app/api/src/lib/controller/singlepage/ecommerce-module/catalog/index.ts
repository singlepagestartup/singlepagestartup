import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { getHttpErrorType } from "@sps/backend-utils";
import {
  catalogCreateOfferSchema,
  catalogSetAttributeSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";
import type { Service } from "../../../../service";

export class Handler {
  constructor(
    readonly service: Service,
    readonly operation: "offer" | "attribute" | "context",
  ) {}

  async execute(c: Context): Promise<Response> {
    c.header("Cache-Control", "private, no-store");
    try {
      const subjectId = c.req.param("id");
      const token = c.req
        .header("Authorization")
        ?.match(/^Bearer (\S+)$/i)?.[1];
      if (
        !subjectId ||
        !token ||
        (await this.service.isAuthorizedService.getSubjectId(token)) !==
          subjectId
      ) {
        throw new HTTPException(401, {
          message: "Authentication error. Caller does not match this Subject",
        });
      }
      const subject = await this.service.authenticationMe({ subjectId });
      if (!subject?.authenticated) {
        throw new HTTPException(401, {
          message: "Authentication error. A signed-in account is required",
        });
      }
      if (this.operation === "context") {
        const data = await this.service.ecommerceCatalog.context(subjectId);
        return c.json({ data });
      }
      const body: unknown = await c.req.json();
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        !("data" in body)
      ) {
        throw new Error("Validation error. Expected a catalogue data envelope");
      }
      if (this.operation === "offer") {
        const parsed = catalogCreateOfferSchema.safeParse(body.data);
        if (!parsed.success) {
          throw new Error("Validation error. Invalid offer creation values");
        }
        const data = await this.service.ecommerceCatalog.createOffer({
          subjectId,
          data: parsed.data,
        });
        return c.json({ data }, 201);
      }
      const parsed = catalogSetAttributeSchema.safeParse(body.data);
      if (!parsed.success) {
        throw new Error("Validation error. Invalid catalogue attribute values");
      }
      const data = await this.service.ecommerceCatalog.setAttribute({
        subjectId,
        data: parsed.data,
      });
      return c.json({ data });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

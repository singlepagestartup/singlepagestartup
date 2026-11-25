import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { getHttpErrorType } from "@sps/backend-utils";
import {
  storeProductCreateOfferSchema,
  catalogMutationSchema,
  catalogSetAttributeSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";
import type { Service } from "../../../../service";
import { STORE_PRODUCT_CREATE_MAX_IMAGES } from "@sps/shared-utils";

export class Handler {
  constructor(
    readonly service: Service,
    readonly operation: "offer" | "attribute" | "context" | "mutation",
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
      const images: File[] = [];
      let body: unknown;
      if (
        this.operation === "offer" &&
        c.req
          .header("Content-Type")
          ?.toLowerCase()
          .startsWith("multipart/form-data")
      ) {
        const form = await c.req.formData().catch(() => undefined);
        const fields = form?.getAll("data");
        if (!form || fields?.length !== 1 || typeof fields[0] !== "string") {
          throw new Error("Validation error. Expected one offer data field");
        }
        for (const [name, field] of form.entries()) {
          if (name === "data") {
            continue;
          }
          if (
            name !== "images" ||
            typeof field === "string" ||
            images.length >= STORE_PRODUCT_CREATE_MAX_IMAGES
          ) {
            throw new Error("Validation error. Invalid offer image selection");
          }
          images.push(field);
        }
        try {
          body = { data: JSON.parse(fields[0]) };
        } catch {
          throw new Error("Validation error. Invalid offer creation data");
        }
      } else {
        body = await c.req.json().catch(() => undefined);
      }
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        !("data" in body)
      ) {
        throw new Error("Validation error. Expected a catalogue data envelope");
      }
      if (this.operation === "mutation") {
        const parsed = catalogMutationSchema.safeParse(body.data);
        if (!parsed.success) {
          throw new Error("Validation error. Invalid catalogue mutation");
        }
        const data = await this.service.ecommerceCatalog.mutation({
          subjectId,
          data: parsed.data,
        });
        return c.json({ data }, parsed.data.method === "POST" ? 201 : 200);
      }
      if (this.operation === "offer") {
        const parsed = storeProductCreateOfferSchema.safeParse(body.data);
        if (!parsed.success) {
          throw new Error("Validation error. Invalid offer creation values");
        }
        const data = await this.service.storeProducts.createOffer(
          subjectId,
          parsed.data,
          images,
        );
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

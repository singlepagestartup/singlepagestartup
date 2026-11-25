import { getHttpErrorType } from "@sps/backend-utils";
import {
  storeCatalogDirectoryKindSchema,
  storeCatalogDirectoryUpdateSchema,
  storeCatalogDirectoryCreateSchema,
  storeProductListSchema,
} from "@sps/rbac/models/subject/sdk/model";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service } from "../../../../service/singlepage/ecommerce/catalog/directories";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    c.header("Cache-Control", "private, no-store");
    const subjectId = c.get("signedInSubjectId") as string;
    if (!subjectId) {
      throw new HTTPException(401, {
        message: "Authentication error. Sign in to continue",
      });
    }
    try {
      const storeId = z.uuid().parse(c.req.param("storeId"));
      const kind = storeCatalogDirectoryKindSchema.parse(c.req.param("kind"));
      if (c.req.param("recordId")) {
        const id = z.uuid().parse(c.req.param("recordId"));
        const token = c.req
          .header("Authorization")
          ?.match(/^Bearer (\S+)$/i)?.[1];
        if (c.req.method === "GET") {
          const data = await withConsistencySnapshot(() =>
            this.service.detail(subjectId, storeId, kind, id, token),
          );
          return c.json({ data });
        }
        const body = await c.req.json().catch(() => undefined);
        const { data: input } = z
          .object({ data: storeCatalogDirectoryUpdateSchema })
          .strict()
          .parse(body);
        if (kind !== input.kind) {
          throw new Error(
            "Validation error. Directory does not match the submitted record",
          );
        }
        const data = await this.service.update(
          subjectId,
          storeId,
          id,
          input,
          token,
        );
        return c.json({ data });
      }
      if (c.req.method === "GET") {
        const params = storeProductListSchema.parse(c.req.query());
        const data = await withConsistencySnapshot(() =>
          this.service.list(subjectId, storeId, kind, params),
        );
        return c.json({ data });
      }
      const body = await c.req.json().catch(() => undefined);
      const { data: input } = z
        .object({ data: storeCatalogDirectoryCreateSchema })
        .strict()
        .parse(body);
      if (kind !== input.kind) {
        throw new Error(
          "Validation error. Directory does not match the submitted record",
        );
      }
      const data = await this.service.create(subjectId, storeId, input);
      return c.json({ data }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid catalog directory parameters",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { getHttpErrorType } from "@sps/backend-utils";
import {
  storeProductDetailSchema,
  storeProductListSchema,
  storeProductUpdateSchema,
} from "@sps/rbac/models/subject/sdk/model";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service } from "../../../../service/singlepage/ecommerce/product/store-management";

export class Handler {
  constructor(
    readonly service: Service,
    readonly operation: "list" | "detail" | "update" | "upload-image",
  ) {}

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
      if (this.operation === "list") {
        const { offset, limit, search } = storeProductListSchema.parse(
          c.req.query(),
        );
        const data = await withConsistencySnapshot(() =>
          this.service.list(subjectId, storeId, offset, limit, search),
        );
        return c.json({ data });
      }
      const productId = z.uuid().parse(c.req.param("productId"));
      const scope = { storeId, productId };
      if (this.operation === "upload-image") {
        const form = await c.req.formData().catch(() => undefined);
        const [file] = z
          .tuple([z.instanceof(File)])
          .parse(form?.getAll("file"));
        const data = await this.service.uploadImage(subjectId, scope, file);
        return c.json({ data }, 201);
      }
      if (this.operation === "update") {
        const body: unknown = await c.req.json().catch(() => undefined);
        const { data: input } = z
          .object({ data: storeProductUpdateSchema })
          .strict()
          .parse(body);
        const data = await this.service.update(subjectId, scope, input, true);
        return c.json({ data });
      }
      const { ordersOffset } = storeProductDetailSchema.parse(c.req.query());
      const data = await withConsistencySnapshot(() =>
        this.service.detail(
          subjectId,
          scope,
          ordersOffset,
          ordersOffset === undefined,
        ),
      );
      return c.json({ data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid store product parameters",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

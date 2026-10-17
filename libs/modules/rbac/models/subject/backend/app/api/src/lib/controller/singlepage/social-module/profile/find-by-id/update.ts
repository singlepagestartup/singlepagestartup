import { getHttpErrorType } from "@sps/backend-utils";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as profileApi } from "@sps/social/models/profile/sdk/server";
export class Handler {
  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("socialModuleProfileId");
      if (!id || !RBAC_SECRET_KEY)
        throw new Error(
          "Validation error. Profile id and configuration are required",
        );
      const body = await c.req.json();
      const data = body.data;
      if (!data || typeof data !== "object")
        throw new Error("Validation error. Invalid Profile payload");
      const allowed: Record<string, unknown> = {};
      for (const key of ["title", "subtitle", "description"]) {
        if (data[key] !== undefined) {
          if (
            !data[key] ||
            typeof data[key] !== "object" ||
            Array.isArray(data[key]) ||
            Object.values(data[key]).some((value) => typeof value !== "string")
          )
            throw new Error("Validation error. Invalid Profile text");
          allowed[key] = data[key];
        }
      }
      if (data.slug !== undefined) {
        if (
          typeof data.slug !== "string" ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) ||
          data.slug.length > 100
        )
          throw new Error("Validation error. Invalid Profile slug");
        allowed.slug = data.slug;
      }
      return c.json({
        data: await profileApi.update({
          id,
          data: allowed,
          options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
        }),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

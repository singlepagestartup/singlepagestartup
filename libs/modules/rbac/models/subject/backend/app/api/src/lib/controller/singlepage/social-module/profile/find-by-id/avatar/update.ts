import { getHttpErrorType } from "@sps/backend-utils";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context, _next: Next): Promise<Response> {
    try {
      const formData = await c.req.formData();
      const dataValue = formData.get("data");
      let data: unknown = {};

      if (dataValue !== null) {
        if (typeof dataValue !== "string") {
          throw new Error("Validation error. Invalid avatar data payload");
        }
        try {
          data = JSON.parse(dataValue);
        } catch {
          throw new Error("Validation error. Invalid JSON in avatar data");
        }
      }

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid avatar data payload");
      }

      const result = await this.service.socialModuleProfileAvatarUpdate({
        socialModuleProfileId: c.req.param("socialModuleProfileId"),
        file:
          formData.get("file") ||
          formData.get("avatar") ||
          formData.get("image"),
        reset: "reset" in data && data.reset === true,
      });

      return c.json({ data: result });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

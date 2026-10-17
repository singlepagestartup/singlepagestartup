import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../../../service";
export class Handler {
  constructor(private readonly service: Service) {}
  async execute(c: Context): Promise<Response> {
    try {
      return c.json({
        data: await this.service.socialModuleProfileAvatarFind({
          socialModuleProfileId: c.req.param("socialModuleProfileId"),
        }),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { getCookie } from "hono/cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const provider = c.req.param("provider");

      if (!provider) {
        throw new Error("Validation error. OAuth provider is required");
      }

      const body = (await c.req.parseBody().catch(() => ({}))) as Record<
        string,
        string | File
      >;

      let data: { flow?: "signin" | "link"; redirectTo?: string } | undefined;
      if (typeof body["data"] === "string" && body["data"].trim()) {
        data = JSON.parse(body["data"]);
      }

      const authorization =
        c.req.header("Authorization")?.replace("Bearer ", "") ||
        getCookie(c, "rbac.subject.jwt");

      const entity = await this.service.authenticationOAuthStart({
        provider,
        authorization,
        data,
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

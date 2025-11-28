import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import QueryString from "qs";
import { Service } from "../../../../service";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const secretKeyHeader = c.req.header("X-RBAC-SECRET-KEY");
      const secretKeyCookie = getCookie(c, "rbac.secret-key");
      const secretKey = secretKeyHeader || secretKeyCookie;

      if (secretKey && secretKey !== RBAC_SECRET_KEY) {
        throw new Error("Validation error. Unauthorized");
      }

      if (secretKey && secretKey === RBAC_SECRET_KEY) {
        return c.json({
          data: {
            ok: true,
          },
        });
      }

      const params = c.req.query();
      const parsedQuery = QueryString.parse(params);

      if (!parsedQuery?.["permission"]) {
        throw new Error("Validation error. No permission provided in query");
      }

      if (!parsedQuery?.["permission"]?.["route"]) {
        throw new Error(
          "Validation error. No route provided in 'action' query",
        );
      }

      if (!parsedQuery?.["permission"]?.["method"]) {
        throw new Error(
          "Validation error. No method provided in 'permission' query",
        );
      }

      const authorizationCookie = getCookie(c, "rbac.subject.jwt");
      const authorizationHeader = c.req.header("Authorization");
      const authorization =
        authorizationCookie || authorizationHeader?.replace("Bearer ", "");

      const isAuthorizedProps = {
        permission: {
          route: parsedQuery["permission"]["route"],
          method: parsedQuery["permission"]["method"],
          type: parsedQuery["permission"]["type"] || "HTTP",
        },
        authorization: {
          value: authorization,
        },
      };

      const data = await this.service.isAuthorized(isAuthorizedProps);

      return c.json({
        data,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

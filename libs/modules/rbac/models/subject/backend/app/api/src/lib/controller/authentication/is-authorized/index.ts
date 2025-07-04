import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import QueryString from "qs";
import { Service } from "../../../service";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

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
        throw new HTTPException(401, {
          message: "Unauthorized",
        });
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

      if (!parsedQuery?.["action"]) {
        throw new HTTPException(400, {
          message: "No action provided in query",
        });
      }

      if (!parsedQuery?.["action"]?.["route"]) {
        throw new HTTPException(400, {
          message: "No route provided in 'action' query",
        });
      }

      if (!parsedQuery?.["action"]?.["method"]) {
        throw new HTTPException(400, {
          message: "No method provided in 'action' query",
        });
      }

      const authorizationCookie = getCookie(c, "rbac.subject.jwt");
      const authorizationHeader = c.req.header("Authorization");
      const authorization =
        authorizationCookie || authorizationHeader?.replace("Bearer ", "");

      const isAuthorizedProps = {
        action: {
          route: parsedQuery["action"]["route"],
          method: parsedQuery["action"]["method"],
          type: parsedQuery["action"]["type"] || "HTTP",
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
      if (error.message.includes("Authorization error")) {
        throw new HTTPException(401, {
          message: error.message || "Unauthorized",
          cause: error,
        });
      }

      throw new HTTPException(500, {
        message: error.message || "Internal server error",
        cause: error,
      });
    }
  }
}

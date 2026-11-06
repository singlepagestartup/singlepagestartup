import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import QueryString from "qs";
import { Service } from "../../../../service";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import {
  authorization,
  getHttpErrorType,
  readRbacSecret,
} from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const secretKey = readRbacSecret(c);

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

      const isAuthorizedProps = {
        permission: {
          route: parsedQuery["permission"]["route"],
          method: parsedQuery["permission"]["method"],
          type: parsedQuery["permission"]["type"] || "HTTP",
        },
        authorization: {
          value: authorization(c),
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

import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../service";
import * as jwt from "hono/jwt";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { authorization, getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);
      const token = authorization(c);
      const session = token
        ? await jwt.verify(token, RBAC_JWT_SECRET, "HS256")
        : undefined;
      const subjectId = session?.subject?.["id"];

      const entity = await this.service.authenticationLoginAndPassowrd({
        data,
        type: "registration",
        roles: data.roles || [],
        subjectId: typeof subjectId === "string" ? subjectId : undefined,
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

import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 200,
          },
        );
      }

      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. JWT secret not provided");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (!decoded.subject?.["id"]) {
        throw new Error("Not Found error. No subject provided in the token");
      }

      // const entity = await this.service.findById({
      //   id: decoded.subject?.["id"],
      // });

      if (!decoded.subject) {
        throw new Error("Not Found error. No subject provided in the token");
      }

      return c.json({
        data: decoded.subject,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

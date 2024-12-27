import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/sps-backend-utils";
import { Service } from "../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
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
      throw new HTTPException(500, {
        message: "JWT secret not provided",
      });
    }

    try {
      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (!decoded.subject?.["id"]) {
        throw new HTTPException(401, {
          message: "No subject provided in the token",
        });
      }

      // const entity = await this.service.findById({
      //   id: decoded.subject?.["id"],
      // });

      if (!decoded.subject) {
        throw new HTTPException(401, {
          message: "No subject provided in the token",
        });
      }

      return c.json({
        data: decoded.subject,
      });
    } catch (error) {
      throw new HTTPException(401, {
        message: error?.["message"] || "Invalid authorization token provided",
      });
    }
  }
}

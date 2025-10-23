import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { Service } from "../../../service";
import { setCookie } from "hono/cookie";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
        throw new Error(
          "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
        );
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      const data = JSON.parse(body["data"]);

      const entity = await this.service.authenticationEthereumVirtualMachine({
        data,
      });

      const decoded = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

      if (!decoded.exp) {
        throw new Error("Validation error. Invalid token issued");
      }

      setCookie(c, "rbac.subject.jwt", entity.jwt, {
        path: "/",
        secure: true,
        httpOnly: false,
        maxAge: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        expires: new Date(decoded.exp),
        sameSite: "Strict",
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

import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { Service } from "../../service";
import { setCookie } from "hono/cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      });
    }

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new HTTPException(400, {
        message: "Invalid data",
      });
    }

    const data = JSON.parse(body["data"]);

    const entity = await this.service.authenticationEthereumVirtualMachine({
      data,
    });

    const decoded = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

    if (!decoded.exp) {
      throw new HTTPException(400, {
        message: "Invalid token issued",
      });
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
  }
}

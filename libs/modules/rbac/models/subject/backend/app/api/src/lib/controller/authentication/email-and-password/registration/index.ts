import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { Service } from "../../../../service";
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

    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return next();
    }

    const data = JSON.parse(body["data"]);

    const entity = await this.service.authenticationLoginAndPassowrd({
      data,
      type: "registration",
      roles: data.roles || [],
    });

    const decodedJwt = await jwt.verify(entity.jwt, RBAC_JWT_SECRET);

    if (!decodedJwt.exp) {
      throw new HTTPException(400, {
        message: "Invalid token issued",
      });
    }

    setCookie(c, "rbac.subject.jwt", entity.jwt, {
      path: "/",
      secure: true,
      httpOnly: false,
      expires: new Date(decodedJwt.exp),
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
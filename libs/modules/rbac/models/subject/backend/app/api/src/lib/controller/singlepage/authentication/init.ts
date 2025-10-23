import {
  RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { api } from "@sps/rbac/models/subject/sdk/server";
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
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS) {
        throw new Error(
          "Configuration error. RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
        );
      }

      const entity = await api.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const jwtToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: entity,
        },
        RBAC_JWT_SECRET,
      );

      const refreshToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) +
            RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: entity,
        },
        RBAC_JWT_SECRET,
      );

      const decodedJwt = await jwt.verify(jwtToken, RBAC_JWT_SECRET);

      if (!decodedJwt.exp) {
        throw new Error("Validation error. Invalid token issued");
      }

      setCookie(c, "rbac.subject.jwt", jwtToken, {
        path: "/",
        secure: true,
        httpOnly: false,
        expires: new Date(decodedJwt.exp),
        sameSite: "Strict",
      });

      return c.json(
        {
          data: {
            jwt: jwtToken,
            refresh: refreshToken,
          },
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

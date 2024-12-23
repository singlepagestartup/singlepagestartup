import {
  RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { Service } from "../service";
import { setCookie } from "hono/cookie";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC_SECRET_KEY not set",
      });
    }
    if (!RBAC_JWT_SECRET) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_SECRET not set",
      });
    }

    if (!RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS) {
      throw new HTTPException(400, {
        message: "RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
      });
    }

    try {
      this.service.clearAnonymusSessions();

      const entity = await api.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
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
            RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: entity,
        },
        RBAC_JWT_SECRET,
      );

      const decodedJwt = await jwt.verify(jwtToken, RBAC_JWT_SECRET);

      if (!decodedJwt.exp) {
        throw new HTTPException(400, {
          message: "Invalid token issued",
        });
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
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}

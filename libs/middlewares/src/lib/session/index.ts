import { createMiddleware } from "hono/factory";
import {
  RBAC_COOKIE_SESSION_EXPIRATION_SECONDS,
  RBAC_COOKIE_SESSION_NAME,
  RBAC_COOKIE_SESSION_SECRET,
  RBAC_SECRET_KEY,
  RBAC_SESSION_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { getCookie, setCookie } from "hono/cookie";
import * as Iron from "iron-webcrypto";
import { MiddlewareHandler } from "hono";
import { api } from "@sps/rbac/models/session/sdk/server";
import { IModel } from "@sps/rbac/models/session/sdk/model";

export type IMiddlewareGeneric = {
  Variables: {
    session: IModel | null | undefined;
  };
};

interface SessionOptions {
  cookieSessionSecret?: string;
  cookieSessionExpirationSeconds?: number;
  cookieSessionName?: string;
}

export class Middleware {
  cookieSessionSecret: string;
  cookieSessionExpirationSeconds: number;
  cookieSessionName: string;

  constructor(options?: SessionOptions) {
    const cookieSessionSecret = RBAC_COOKIE_SESSION_SECRET;

    if (!cookieSessionSecret) {
      throw new Error("Cookie session secret is required");
    }

    if (cookieSessionSecret.length < 32) {
      throw new Error(
        "Cookie session secret must be at least 32 characters long",
      );
    }

    this.cookieSessionSecret = cookieSessionSecret;

    const cookieSessionExpirationSeconds = parseInt(
      RBAC_COOKIE_SESSION_EXPIRATION_SECONDS,
    );

    this.cookieSessionExpirationSeconds = cookieSessionExpirationSeconds;

    const cookieSessionName =
      options?.cookieSessionName || RBAC_COOKIE_SESSION_NAME;

    this.cookieSessionName = cookieSessionName;
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      let sid: string | null | undefined;
      let session: IModel | null | undefined;
      let createNewSession = false;

      if (c.req.header("X-RBAC-SECRET-KEY")) {
        return await next();
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error(
          "Configuration error. RBAC_SECRET_KEY is required for sessions middleware to work",
        );
      }

      const sessionCookie = getCookie(c, this.cookieSessionName);

      if (c.req.url.includes("/api/rbac/sessions")) {
        return await next();
      }

      if (sessionCookie) {
        const cookieData = await Iron.unseal(
          globalThis.crypto,
          sessionCookie,
          { default: this.cookieSessionSecret },
          Iron.defaults,
        ).catch((error) => {
          createNewSession = true;
        });

        if (typeof cookieData === "string") {
          sid = cookieData;

          const existingSessions = await api.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "eq",
                    value: cookieData,
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });

          session = existingSessions?.[0];
        }

        if (session) {
          const needToProlongate =
            new Date(session.expiresAt).getTime() > Date.now() &&
            new Date(session.expiresAt).getTime() - Date.now() <
              RBAC_SESSION_LIFETIME_IN_SECONDS * 0.8 * 1000;

          if (needToProlongate) {
            const prolongatedSession = await api.update({
              data: {
                expiresAt: new Date(
                  Date.now() + RBAC_SESSION_LIFETIME_IN_SECONDS * 1000,
                ).toISOString(),
              },
              id: session.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });

            session = prolongatedSession;
          } else {
            createNewSession = true;
          }
        } else {
          createNewSession = true;
        }
      } else {
        createNewSession = true;
      }

      if (createNewSession) {
        const createdSession = await api.create({
          data: {
            expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (!createdSession) {
          throw new Error("Not Found error. Session not found");
        }

        sid = createdSession.id;
        session = createdSession;
      }

      const cookieData = await Iron.seal(
        globalThis.crypto,
        sid,
        this.cookieSessionSecret,
        Iron.defaults,
      );

      if (!session) {
        throw new Error("Not Found error. Session not found");
      }

      await next();

      setCookie(c, this.cookieSessionName, cookieData, {
        path: "/",
        secure: true,
        httpOnly: false,
        maxAge: this.cookieSessionExpirationSeconds,
        expires: new Date(session.expiresAt),
        sameSite: "Strict",
      });
    }).bind(this);
  }
}

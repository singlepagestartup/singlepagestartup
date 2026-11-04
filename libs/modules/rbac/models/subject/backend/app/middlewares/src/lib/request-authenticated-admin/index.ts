import { verifyJwt } from "@sps/backend-utils";
import {
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
} from "@sps/shared-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

interface IOptions {
  authenticationMe: (props: {
    subjectId: string;
  }) => Promise<{ authenticated: boolean } | undefined>;
  isAdmin: (subjectId: string) => Promise<boolean>;
}

export class Middleware {
  init(options: IOptions) {
    return createMiddleware(async (c, next) => {
      const token = c.req
        .header("Authorization")
        ?.match(/^Bearer (\S+)$/i)?.[1];
      if (!token) throw new HTTPException(401, { message: "Unauthorized" });
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      const claims = await verifyJwt(token, RBAC_JWT_SECRET).catch(() => {
        throw new HTTPException(401, { message: "Unauthorized" });
      });
      const subjectId = claims.subject?.["id"];
      const { exp, iat } = claims;

      // SPS currently signs access and refresh JWTs with the same key.
      // Existing access issuers can calculate iat and exp one second apart.
      if (
        typeof subjectId !== "string" ||
        !subjectId ||
        typeof exp !== "number" ||
        typeof iat !== "number" ||
        exp <= iat ||
        exp - iat > RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS + 1
      ) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }

      const subject = await options.authenticationMe({ subjectId });
      if (!subject?.authenticated) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }
      if (!(await options.isAdmin(subjectId))) {
        throw new HTTPException(403, {
          message: "Administrator role required",
        });
      }

      await next();
    });
  }
}

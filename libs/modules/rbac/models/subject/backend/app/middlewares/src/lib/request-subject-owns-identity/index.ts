import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import type { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

interface IService {
  subjectsToIdentities: {
    find(props: {
      params: {
        filters: {
          and: { column: string; method: "eq"; value: string }[];
        };
      };
    }): Promise<{ subjectId: string; identityId: string }[]>;
  };
}

export class Middleware {
  constructor(readonly service: IService) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        if (!RBAC_JWT_SECRET)
          throw new Error("Configuration error. RBAC_JWT_SECRET not set");
        const subjectId = c.req.param("uuid");
        const identityId = c.req.param("identityUuid");
        if (!subjectId || !identityId)
          throw new Error(
            "Validation error. Subject and Identity are required",
          );
        const token = authorization(c);
        if (!token) throw new Error("Validation error. No token");
        const decoded = await verify(token, RBAC_JWT_SECRET);
        if (decoded?.["subject"]?.["id"] !== subjectId)
          throw new Error(
            "Authorization error. Only identity owner can update identity.",
          );
        const links = await this.service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [
                { column: "subjectId", method: "eq", value: subjectId },
                { column: "identityId", method: "eq", value: identityId },
              ],
            },
          },
        });
        if (!links.length)
          throw new Error("Not Found error. No subjects to identities found");
        if (links.length !== 1)
          throw new Error(
            "Internal error. Multiple subjects to identities found",
          );
        return next();
      } catch (error) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}

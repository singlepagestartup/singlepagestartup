import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

interface IOptions {
  getSubjectId: (accessToken: string) => Promise<string>;
  isAuthenticated: (subjectId: string) => Promise<boolean>;
}

export class Middleware {
  init(options: IOptions) {
    return createMiddleware(async (c, next) => {
      c.header("Cache-Control", "private, no-store");
      const token = c.req
        .header("Authorization")
        ?.match(/^Bearer (\S+)$/i)?.[1];
      const expectedSubjectId = c.req.param("id");
      if (!token || !expectedSubjectId) {
        throw new HTTPException(401, {
          message: "Authentication error. Sign in to continue",
        });
      }

      const subjectId = await options
        .getSubjectId(token)
        .catch(() => undefined);
      if (
        subjectId !== expectedSubjectId ||
        !(await options.isAuthenticated(subjectId))
      ) {
        throw new HTTPException(401, {
          message: "Authentication error. Sign in to continue",
        });
      }

      c.set("signedInSubjectId", subjectId);
      await next();
    });
  }
}

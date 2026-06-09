import { getHttpErrorType } from "@sps/backend-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

type IService = {
  socialModuleChatLifecycleAssertSubjectOwnsChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }): Promise<unknown>;
};

export class Middleware {
  constructor(private readonly service: IService) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        const id = c.req.param("id");

        if (!id) {
          throw new Error("Validation error. No id provided");
        }

        const socialModuleChatId = c.req.param("socialModuleChatId");

        if (!socialModuleChatId) {
          throw new Error("Validation error. No socialModuleChatId provided");
        }

        await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
          subjectId: id,
          socialModuleChatId,
        });

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}

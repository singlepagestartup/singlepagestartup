import { getHttpErrorType } from "@sps/backend-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

type IService = {
  socialModuleChatLifecycleAssertThreadBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }): Promise<unknown>;
};

export class Middleware {
  constructor(private readonly service: IService) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        const socialModuleChatId = c.req.param("socialModuleChatId");

        if (!socialModuleChatId) {
          throw new Error("Validation error. No socialModuleChatId provided");
        }

        const socialModuleThreadId = c.req.param("socialModuleThreadId");

        if (!socialModuleThreadId) {
          throw new Error("Validation error. No socialModuleThreadId provided");
        }

        await this.service.socialModuleChatLifecycleAssertThreadBelongsToChat({
          socialModuleChatId,
          socialModuleThreadId,
        });

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}

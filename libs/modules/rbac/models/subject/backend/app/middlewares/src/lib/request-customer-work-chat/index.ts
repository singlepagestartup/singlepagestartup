import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";

interface IService {
  assertChatAccess(input: {
    subjectId: string;
    chatId: string;
    edit: boolean;
  }): Promise<void>;
}

export class Middleware {
  constructor(private readonly customerWork: IService) {}

  init(edit: boolean) {
    return createMiddleware(async (c, next) => {
      try {
        const subjectId = c.req.param("id");
        const chatId = c.req.param("socialModuleChatId");
        if (subjectId && chatId) {
          await this.customerWork.assertChatAccess({ subjectId, chatId, edit });
        }
        return next();
      } catch (error) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}

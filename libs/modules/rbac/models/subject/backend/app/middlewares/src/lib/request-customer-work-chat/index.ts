import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";

interface IService {
  assertChatAccess(input: {
    subjectId: string;
    chatId: string;
    threadId?: string;
    edit: boolean;
    targetProfileId?: string;
    settingsOperation?: string;
  }): Promise<
    | "staff"
    | void
    | {
        staff: boolean;
        taskChatScope: unknown;
        readTaskChatSettings?: boolean;
        sharedTaskThread?: { taskId: string; threadId: string };
      }
  >;
}

export class Middleware {
  constructor(private readonly customerWork: IService) {}

  init(edit: boolean, settingsOperation?: string) {
    return createMiddleware(async (c, next) => {
      try {
        const subjectId = c.req.param("id");
        const chatId = c.req.param("socialModuleChatId");
        if (subjectId && chatId) {
          const threadId = c.req.param("socialModuleThreadId");
          const targetProfileId = c.req.param("targetSocialModuleProfileId");
          const access = await this.customerWork.assertChatAccess({
            subjectId,
            chatId,
            threadId,
            edit,
            ...(settingsOperation ? { settingsOperation } : {}),
            ...(targetProfileId ? { targetProfileId } : {}),
          });
          if (access === "staff" || access?.staff) {
            c.set("taskChatStaff", true);
          }
          if (access && access !== "staff") {
            c.set("taskChatScope", access.taskChatScope);
            c.set("readTaskChatSettings", access.readTaskChatSettings);
            c.set("sharedTaskThread", access.sharedTaskThread);
          }
        }
        return next();
      } catch (error) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }
}

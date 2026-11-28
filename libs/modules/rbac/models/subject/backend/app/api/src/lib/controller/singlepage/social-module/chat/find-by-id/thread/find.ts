import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Context } from "hono";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { SUPPORT_THREAD_VARIANT } from "@sps/social/models/thread/sdk/model";
import { Service as ChatActivity } from "../../../../../../service/singlepage/social-module/chat/activity";
import { Service as ThreadContext } from "../../../../../../service/singlepage/social-module/chat/thread-context";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

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

      const parsedQuery = c.get("parsedQuery");
      const threadId = c.req.query("threadId");
      const variant = c.req.query("variant");
      if (threadId !== undefined && !z.uuid().safeParse(threadId).success) {
        throw new Error("Validation error. Invalid thread ID");
      }
      if (variant !== undefined && variant !== SUPPORT_THREAD_VARIANT) {
        throw new Error("Validation error. Invalid thread variant");
      }
      const sharedThread = c.get("sharedTaskThread");
      const supportByTask =
        await this.service.customerWork.orderSupport.prepareChat(
          id,
          socialModuleChatId,
          sharedThread?.taskId,
        );
      const visibleSupportIds = [...supportByTask.values()];
      const sharedThreadIds = sharedThread
        ? [
            sharedThread.threadId,
            supportByTask.get(sharedThread.taskId),
          ].filter((value): value is string => Boolean(value))
        : undefined;
      if (threadId && sharedThreadIds && !sharedThreadIds.includes(threadId)) {
        throw new Error("Not Found error. This discussion is unavailable");
      }
      const allowedThreadIds =
        variant === SUPPORT_THREAD_VARIANT
          ? visibleSupportIds
          : sharedThreadIds;
      if (allowedThreadIds?.length === 0) {
        return c.json({ data: [] });
      }
      const limit = parsedQuery?.limit || 100;
      const offset = parsedQuery?.offset || 0;
      const orderBy = parsedQuery?.orderBy;

      const data = await withConsistencySnapshot(async () => {
        const orderSupport = this.service.customerWork.orderSupport;
        const hiddenThreadIds = (
          await orderSupport.threadIdsForChat(socialModuleChatId)
        ).filter((id) => !visibleSupportIds.includes(id));
        const socialModuleChatsToThreads =
          await this.service.modules.social.chatsToThreads.find({
            params: {
              filters: {
                and: [
                  {
                    column: "chatId",
                    method: "eq",
                    value: socialModuleChatId,
                  },
                  ...(threadId
                    ? [
                        {
                          column: "threadId",
                          method: "eq" as const,
                          value: threadId,
                        },
                      ]
                    : []),
                  ...(allowedThreadIds
                    ? [
                        {
                          column: "threadId",
                          method: "inArray" as const,
                          value: allowedThreadIds,
                        },
                      ]
                    : []),
                  ...(hiddenThreadIds.length
                    ? [
                        {
                          column: "threadId",
                          method: "notInArray" as const,
                          value: hiddenThreadIds,
                        },
                      ]
                    : []),
                ],
              },
              limit,
              offset,
              orderBy,
            },
          });

        if (!socialModuleChatsToThreads.length) {
          return [];
        }

        const socialModuleThreads =
          await this.service.modules.social.thread.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: socialModuleChatsToThreads.map((chatToThread) => {
                      return chatToThread.threadId;
                    }),
                  },
                ],
              },
              orderBy,
            },
          });

        const threads = await new ThreadContext(this.service).enrich(
          socialModuleThreads,
        );
        return new ChatActivity(this.service).forThreads(
          id,
          socialModuleChatId,
          threads,
        );
      });
      return c.json({ data });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

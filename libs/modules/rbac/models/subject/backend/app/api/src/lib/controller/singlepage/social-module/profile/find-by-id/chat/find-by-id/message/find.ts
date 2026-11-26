import {
  CHAT_THREAD_MESSAGES_PAGE_SIZE,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { Context } from "hono";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service as SocialModuleChatMessages } from "../../../../../../../../service/startup/social-module/chat/messages";

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

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const socialModuleThreadId = c.req.param("socialModuleThreadId");

      await this.assertProfileCanAccessChat({
        subjectId: id,
        socialModuleProfileId,
        socialModuleChatId,
      });

      const parsedQuery = c.get("parsedQuery");
      const limit = parsedQuery?.limit || CHAT_THREAD_MESSAGES_PAGE_SIZE;
      const offset = parsedQuery?.offset || 0;
      const orderBy = parsedQuery?.orderBy;

      if (socialModuleThreadId) {
        await this.service.socialModuleChatLifecycleAssertThreadBelongsToChat({
          socialModuleChatId,
          socialModuleThreadId,
        });

        const reader = new SocialModuleChatMessages(this.service);
        if (parsedQuery?.populate === "attachment-index") {
          const data = await withConsistencySnapshot(() =>
            reader.threadAttachmentIndex(socialModuleThreadId),
          );
          return c.json({ data });
        }
        const messageId = c.req.query("attachmentMessageId");
        if (messageId !== undefined && !z.uuid().safeParse(messageId).success) {
          throw new Error("Validation error. Invalid attachment message ID");
        }
        const socialModuleThreadsToMessages =
          await this.service.modules.social.threadsToMessages.find({
            params: {
              filters: {
                and: [
                  {
                    column: "threadId",
                    method: "eq",
                    value: socialModuleThreadId,
                  },
                  ...(messageId
                    ? [
                        {
                          column: "messageId",
                          method: "eq" as const,
                          value: messageId,
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

        if (!socialModuleThreadsToMessages?.length) {
          return c.json({
            data: [],
          });
        }

        const socialModuleMessages =
          await this.service.modules.social.message.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: socialModuleThreadsToMessages.map(
                      (socialModuleThreadsToMessage) => {
                        return socialModuleThreadsToMessage.messageId;
                      },
                    ),
                  },
                ],
              },
              orderBy,
            },
          });

        const messages = await reader.enrich(socialModuleMessages);

        return c.json({
          data: messages,
        });
      }

      const socialModuleChatsToMessages =
        await this.service.modules.social.chatsToMessages.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
            limit,
            offset,
            orderBy,
          },
        });

      if (!socialModuleChatsToMessages?.length) {
        return c.json({
          data: [],
        });
      }

      const socialModuleMessages =
        await this.service.modules.social.message.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: socialModuleChatsToMessages?.map(
                    (socialModuleChatsToMessage) => {
                      return socialModuleChatsToMessage.messageId;
                    },
                  ),
                },
              ],
            },
            orderBy,
          },
        });

      const messages = await new SocialModuleChatMessages(this.service).enrich(
        socialModuleMessages,
      );

      return c.json({
        data: messages,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async assertProfileCanAccessChat(props: {
    subjectId: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const socialModuleProfilesToChats =
      await this.service.modules.social.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    if (socialModuleProfilesToChats?.length) {
      return;
    }

    if (await this.isSubjectAdmin(props.subjectId)) {
      return;
    }

    throw new Error(
      "Authorization error. Requested social-module chat does not belong to profile",
    );
  }

  async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectsToRoles = await this.service.module.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
      },
    });

    const roleIds =
      subjectsToRoles
        ?.map((subjectToRole) => subjectToRole.roleId)
        .filter((roleId): roleId is string => Boolean(roleId)) || [];

    if (!roleIds.length) {
      return false;
    }

    const roles = await this.service.module.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: roleIds,
            },
          ],
        },
      },
    });

    return Boolean(roles?.find((role) => role.slug === "admin"));
  }
}

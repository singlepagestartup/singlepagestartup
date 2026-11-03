import {
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  AI_CHAT_DOCUMENTS,
  assertSupportedAiChatAttachments,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel as ISocialModuleMessagesToFileStorageModuleFile } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/model";
import {
  assertKnowledgeAttachmentBytes,
  getHttpErrorType,
  logger,
} from "@sps/backend-utils";
import {
  IModel as ISocialModuleMessage,
  shouldAwaitSocialMessageNotification,
} from "@sps/social/models/message/sdk/model";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import {
  AudioTranscriptionService,
  shouldSkipOrdinaryNotificationForAudioTranscription,
} from "./audio-transcription";
import {
  normalizeRbacAiReactionRequestMetadata,
  parseRbacAiReactionRequestMetadata,
  getAIChatDocument,
  RBAC_AI_REACTION_REQUEST_METADATA_KEY,
} from "@sps/rbac/models/subject/sdk/model";
import { getDrizzle } from "@sps/shared-backend-database-config";
import { withConsistencyDatabase } from "@sps/shared-backend-api";

export class Handler {
  service: Service;
  audioTranscriptionService = new AudioTranscriptionService();

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

      const socialModuleThreadIdFromPath = c.req.param("socialModuleThreadId");

      await this.assertProfileCanAccessChat({
        subjectId: id,
        socialModuleProfileId,
        socialModuleChatId,
      });

      const formData = await c.req.formData();
      const dataField = formData.get("data");

      if (typeof dataField !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof dataField,
        );
      }

      const parsedBody: {
        data?: {
          [key: string]: any;
        };
        files?: {
          [key: string]: File | File[];
        };
      } = {};

      try {
        parsedBody.data = JSON.parse(dataField);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " + dataField,
        );
      }

      const aiReactionRequest = parseRbacAiReactionRequestMetadata(
        parsedBody.data?.metadata,
      );

      if (aiReactionRequest && parsedBody.data) {
        parsedBody.data.metadata = normalizeRbacAiReactionRequestMetadata(
          parsedBody.data.metadata,
        );
      }

      const requestedThreadId =
        typeof parsedBody.data?.threadId === "string"
          ? parsedBody.data.threadId.trim()
          : "";
      const socialModuleThreadId = await this.resolveTargetThreadId({
        socialModuleChatId,
        pathSocialModuleThreadId: socialModuleThreadIdFromPath || undefined,
        requestedThreadId: requestedThreadId || undefined,
      });

      const thread = await this.service.socialModule.thread.findById({
        id: socialModuleThreadId,
      });
      const document = getAIChatDocument(thread?.metadata);
      if (
        document &&
        document.profileId !== socialModuleProfileId &&
        parsedBody.data
      ) {
        const selectedSourceId =
          parsedBody.data.metadata?.aiChatDocumentSourceId;
        if (
          selectedSourceId !== undefined &&
          (typeof selectedSourceId !== "string" ||
            !document.sourceIds.includes(selectedSourceId))
        )
          throw new Error(
            "Authorization error. Selected Knowledge Source does not belong to this document.",
          );
        const skill = await this.service.socialModuleProfileDocumentSkillFind({
          socialModuleProfileId: document.profileId,
          documentKey: document.key,
        });
        const description =
          typeof parsedBody.data.description === "string"
            ? parsedBody.data.description
            : "";
        const baseSlug = AI_CHAT_DOCUMENTS.find(
          (definition) => definition.key === document.key,
        )?.skillSlug;
        const leadingCommand = description.match(/^\/([^\s]+)(?=\s|$)\s*/);
        const content =
          leadingCommand && [skill.slug, baseSlug].includes(leadingCommand[1])
            ? description.slice(leadingCommand[0].length)
            : description;
        parsedBody.data.description = `/${skill.slug}\n\n${content}`;
        parsedBody.data.metadata = {
          ...parsedBody.data.metadata,
          [RBAC_AI_REACTION_REQUEST_METADATA_KEY]: {
            ...(aiReactionRequest || {
              version: 1,
              modelId: "auto",
              reasoning: "auto",
              useKnowledgeSearch: true,
            }),
            skillIds: [skill.id],
          },
        };
      }

      if (parsedBody.data && "threadId" in parsedBody.data) {
        delete parsedBody.data.threadId;
      }

      const sourceSystemId =
        typeof parsedBody.data?.sourceSystemId === "string"
          ? parsedBody.data.sourceSystemId.trim()
          : "";

      if (sourceSystemId) {
        const existingMessage = await this.findExistingBySourceSystemId({
          sourceSystemId,
          socialModuleChatId,
          socialModuleThreadId,
        });

        if (existingMessage) {
          c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
          return c.json({
            data: existingMessage,
          });
        }
      }

      const files = formData
        .getAll("files")
        .filter((item) => item instanceof File) as File[];
      if (files.length) {
        const chat = await this.service.socialModule.chat.findById({
          id: socialModuleChatId,
        });
        if (chat?.variant === "ai-chat") {
          try {
            assertSupportedAiChatAttachments(files);
            for (const file of files) {
              assertKnowledgeAttachmentBytes({
                bytes: new Uint8Array(await file.arrayBuffer()),
                name: file.name,
                mimeType: file.type,
              });
            }
          } catch (error) {
            throw new Error(
              `Validation error. ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
        parsedBody.files = { files };
      }

      // Object storage work finishes before the short database transaction.
      const uploadedFiles: IFileStorageModuleFile[] = [];
      for (const file of files) {
        const stored = await fileStorageModuleFileApi.create({
          data: { adminTitle: file.name, file },
          options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
        });
        uploadedFiles.push(stored);
      }
      let socialModuleMessage = await getDrizzle({}).transaction((tx) =>
        withConsistencyDatabase(tx, async () => {
          const message = await this.service.socialModule.message.create({
            data: parsedBody.data,
          });
          await this.service.socialModule.chatsToMessages.create({
            data: { messageId: message.id, chatId: socialModuleChatId },
          });
          await this.service.socialModule.threadsToMessages.create({
            data: { messageId: message.id, threadId: socialModuleThreadId },
          });
          await this.service.socialModule.profilesToMessages.create({
            data: { messageId: message.id, profileId: socialModuleProfileId },
          });
          for (const [orderIndex, file] of uploadedFiles.entries())
            await this.service.socialModule.messagesToFileStorageModuleFiles.create(
              {
                data: {
                  messageId: message.id,
                  fileStorageModuleFileId: file.id,
                  orderIndex,
                },
              },
            );
          return message as ISocialModuleMessage;
        }),
      );

      const socialModuleMessagesToFileStorageModuleFiles =
        await this.service.socialModule.messagesToFileStorageModuleFiles.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: socialModuleMessage.id,
                },
              ],
            },
          },
        });

      let fileStorageModuleFiles: IFileStorageModuleFile[] | undefined;

      if (socialModuleMessagesToFileStorageModuleFiles?.length) {
        fileStorageModuleFiles = await this.service.fileStorageModule.file.find(
          {
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: socialModuleMessagesToFileStorageModuleFiles.map(
                      (socialModuleMessagesToFileStorageModuleFile) =>
                        socialModuleMessagesToFileStorageModuleFile.fileStorageModuleFileId,
                    ),
                  },
                ],
              },
            },
          },
        );
      }

      socialModuleMessage = await this.audioTranscriptionService.prepareAndRun({
        fileStorageModuleFiles,
        rbacModuleSubjectId: id,
        socialModuleChatId,
        socialModuleMessage,
        socialModuleProfileId,
        socialModuleThreadId,
      });

      if (
        this.shouldNotifyOtherSubjectsInChat({
          socialModuleMessage,
        })
      ) {
        const notificationPromise = this.notifyOtherSubjectsInChat({
          id,
          socialModuleChatId,
          socialModuleThreadId,
          extendedSocialModuleMessage: {
            ...socialModuleMessage,
            messagesToFileStorageModuleFiles:
              socialModuleMessagesToFileStorageModuleFiles?.map(
                (socialModuleMessagesToFileStorageModuleFile) => {
                  return {
                    ...socialModuleMessagesToFileStorageModuleFile,
                    fileStorageModuleFile: fileStorageModuleFiles?.find(
                      (fileStorageModuleFile) =>
                        fileStorageModuleFile.id ===
                        socialModuleMessagesToFileStorageModuleFile.fileStorageModuleFileId,
                    ),
                  };
                },
              ),
          },
          socialModuleProfileId,
        }).catch((error) => {
          logger.error(error);
        });

        if (
          shouldAwaitSocialMessageNotification(socialModuleMessage.metadata)
        ) {
          await notificationPromise;
        } else {
          void notificationPromise;
        }
      }

      return c.json({
        data: {
          ...socialModuleMessage,
          authorProfileIds: [socialModuleProfileId],
          attachments: (socialModuleMessagesToFileStorageModuleFiles || [])
            .toSorted((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
            .flatMap((link) => {
              const file = fileStorageModuleFiles?.find(
                (file) => file.id === link.fileStorageModuleFileId,
              );
              return file ? [file] : [];
            }),
        },
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async notifyOtherSubjectsInChat(props: {
    id: string;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    extendedSocialModuleMessage: ISocialModuleMessage & {
      messagesToFileStorageModuleFiles:
        | (ISocialModuleMessagesToFileStorageModuleFile & {
            fileStorageModuleFile?: IFileStorageModuleFile;
          })[]
        | undefined;
    };
    socialModuleProfileId: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const socialModuleChat = await this.service.socialModule.chat.findById({
      id: props.socialModuleChatId,
    });

    const socialModuleThread = await this.service.socialModule.thread.findById({
      id: props.socialModuleThreadId,
    });

    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "profileId",
                method: "ne",
                value: props.socialModuleProfileId,
              },
            ],
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      return;
    }

    const subjectsToSocialModuleProfiles =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "inArray",
                value: socialModuleProfilesToChats.map(
                  (socialModuleProfileToChat) =>
                    socialModuleProfileToChat.profileId,
                ),
              },
            ],
          },
        },
      });

    if (!subjectsToSocialModuleProfiles?.length) {
      return;
    }

    const socialModuleProfiles = await this.service.socialModule.profile.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: socialModuleProfilesToChats.map(
                (profileToChat) => profileToChat.profileId,
              ),
            },
          ],
        },
      },
    });

    if (!socialModuleProfiles?.length) {
      return;
    }

    const filteredSubjectsToSocialModuleProfiles =
      subjectsToSocialModuleProfiles.filter((subjectToSocialModuleProfile) =>
        socialModuleProfiles.some(
          (profile) =>
            profile.id === subjectToSocialModuleProfile.socialModuleProfileId,
        ),
      );

    const subjects = await this.service.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: filteredSubjectsToSocialModuleProfiles.map(
                (subjectToSocialModuleProfile) =>
                  subjectToSocialModuleProfile.subjectId,
              ),
            },
          ],
        },
      },
    });

    const socialModuleGenerateSocialModuleMessageCreatedTemplates =
      await this.service.notificationModule.template.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "ilike",
                value: "-social-module-message-created",
              },
            ],
          },
        },
      });

    if (
      subjects?.length &&
      socialModuleGenerateSocialModuleMessageCreatedTemplates?.length
    ) {
      const isTelegramGroup =
        socialModuleChat?.variant === "telegram" &&
        socialModuleChat.sourceSystemId?.startsWith("-");

      let messageCreated = false;

      for (const subject of subjects) {
        if (isTelegramGroup && messageCreated) {
          /**
           * Stop after first message if replies to group chat, because everybody will get notification
           */
          continue;
        }

        const subjectToSocialModuleProfiles =
          subjectsToSocialModuleProfiles.filter(
            (subjectToSocialModuleProfile) =>
              subjectToSocialModuleProfile.subjectId === subject.id,
          );

        if (!subjectToSocialModuleProfiles.length) {
          continue;
        }

        for (const socialModuleGenerateSocialModuleMessageCreatedTemplate of socialModuleGenerateSocialModuleMessageCreatedTemplates) {
          try {
            const files: IFileStorageModuleFile[] = [];

            props.extendedSocialModuleMessage.messagesToFileStorageModuleFiles?.forEach(
              (messageToFileStorageModuleFile) => {
                if (!messageToFileStorageModuleFile.fileStorageModuleFile) {
                  return;
                }

                files.push(
                  messageToFileStorageModuleFile.fileStorageModuleFile,
                );
              },
            );

            const notificationServiceNotifications = await api.notify({
              id: subject.id,
              data: {
                notification: {
                  topic: {
                    slug: "information",
                  },
                  template:
                    socialModuleGenerateSocialModuleMessageCreatedTemplate,
                  notification: {
                    data: {
                      socialModule: {
                        message: props.extendedSocialModuleMessage,
                        thread: socialModuleThread,
                      },
                    },
                  },
                },
                social: {
                  chat: {
                    id: props.socialModuleChatId,
                  },
                  thread: {
                    id: props.socialModuleThreadId,
                  },
                },
                fileStorage: {
                  files,
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            const notificationServiceNotificationSourceSystemId =
              notificationServiceNotifications?.notificationService.notifications?.find(
                (notification) => notification.sourceSystemId,
              )?.sourceSystemId;

            if (notificationServiceNotificationSourceSystemId) {
              await socialModuleMessageApi.update({
                id: props.extendedSocialModuleMessage.id,
                data: {
                  sourceSystemId: notificationServiceNotificationSourceSystemId,
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
              messageCreated = true;
            }
          } catch (error) {
            console.log("🚀 ~ notifyOtherSubjectsInChat ~ error:", error);
            logger.error(error);
          }
        }
      }
    }
  }

  protected shouldNotifyOtherSubjectsInChat(props: {
    socialModuleMessage: Pick<ISocialModuleMessage, "metadata">;
  }) {
    const metadata = props.socialModuleMessage.metadata;

    if (!metadata || typeof metadata !== "object") {
      return true;
    }

    return !shouldSkipOrdinaryNotificationForAudioTranscription(
      props.socialModuleMessage,
    );
  }

  async findExistingBySourceSystemId(props: {
    sourceSystemId: string;
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }): Promise<ISocialModuleMessage | undefined> {
    const messages = await this.service.socialModule.message.find({
      params: {
        filters: {
          and: [
            {
              column: "sourceSystemId",
              method: "eq",
              value: props.sourceSystemId,
            },
          ],
        },
      },
    });

    if (!messages?.length) {
      return;
    }

    const messageIds = messages.map((message) => message.id);

    const chatsToMessages =
      await this.service.socialModule.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "messageId",
                method: "inArray",
                value: messageIds,
              },
            ],
          },
        },
      });

    if (!chatsToMessages?.length) {
      return;
    }

    const messageIdsInChat = chatsToMessages
      .map((item) => item.messageId)
      .filter((id): id is string => Boolean(id));

    if (!messageIdsInChat.length) {
      return;
    }

    const threadsToMessages =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: props.socialModuleThreadId,
              },
              {
                column: "messageId",
                method: "inArray",
                value: messageIdsInChat,
              },
            ],
          },
        },
      });

    if (!threadsToMessages?.length) {
      return;
    }

    const messageIdsSet = new Set(
      threadsToMessages
        .map((threadToMessage) => threadToMessage.messageId)
        .filter((id): id is string => Boolean(id)),
    );

    return messages.find((message) => messageIdsSet.has(message.id));
  }

  async resolveTargetThreadId(props: {
    socialModuleChatId: string;
    pathSocialModuleThreadId?: string;
    requestedThreadId?: string;
  }): Promise<string> {
    if (props.pathSocialModuleThreadId) {
      if (
        props.requestedThreadId &&
        props.requestedThreadId !== props.pathSocialModuleThreadId
      ) {
        throw new Error(
          "Validation error. threadId in path does not match threadId in payload",
        );
      }

      await this.service.socialModuleChatLifecycleAssertThreadBelongsToChat({
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.pathSocialModuleThreadId,
      });

      return props.pathSocialModuleThreadId;
    }

    if (props.requestedThreadId) {
      throw new Error(
        "Validation error. threadId must be provided in route path",
      );
    }

    const defaultThread =
      await this.service.socialModuleChatLifecycleEnsureDefaultThreadForChat({
        socialModuleChatId: props.socialModuleChatId,
      });

    return defaultThread.id;
  }

  async assertProfileCanAccessChat(props: {
    subjectId: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
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
    const subjectsToRoles = await this.service.subjectsToRoles.find({
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

    const roles = await this.service.role.find({
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

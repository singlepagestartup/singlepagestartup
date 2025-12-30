import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessagesToFileStorageModuleFilesApi } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { getHttpErrorType, logger } from "@sps/backend-utils";

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

      const socialModuleMessageId = c.req.param("socialModuleMessageId");

      if (!socialModuleMessageId) {
        throw new Error("Validation error. No socialModuleMessageId provided");
      }

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

      const files = formData
        .getAll("files")
        .filter((item) => item instanceof File) as File[];
      if (files.length) {
        parsedBody.files = { files };
      }

      const socialModuleMessage = await socialModuleMessageApi.update({
        id: socialModuleMessageId,
        data: parsedBody.data || {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage) {
        throw new Error("Not found error. Social module message not updated");
      }

      if (parsedBody.files?.["files"]) {
        const files = parsedBody.files["files"];
        if (Array.isArray(files)) {
          for (const [index, file] of files.entries()) {
            try {
              const fileStorageFile = await fileStorageModuleFileApi.create({
                data: {
                  adminTitle:
                    "Social Module Message Id: " + socialModuleMessage.id,
                  file: file,
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
              await socialModuleMessagesToFileStorageModuleFilesApi.create({
                data: {
                  messageId: socialModuleMessage.id,
                  fileStorageModuleFileId: fileStorageFile.id,
                  orderIndex: index,
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
            }
          }
        } else {
          try {
            const fileStorageFile = await fileStorageModuleFileApi.create({
              data: {
                adminTitle:
                  "Social Module Message Id: " + socialModuleMessage.id,
                file: files,
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
            await socialModuleMessagesToFileStorageModuleFilesApi.create({
              data: {
                messageId: socialModuleMessage.id,
                fileStorageModuleFileId: fileStorageFile.id,
                orderIndex: 0,
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          } catch (error) {
            console.error("Error processing single file:", error);
          }
        }
      }

      const headers: Record<string, string> = {};
      const authorization = c.req.header("authorization");
      if (authorization) {
        headers.Authorization = authorization;
      }

      try {
        await rbacSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate(
          {
            id,
            socialModuleProfileId,
            socialModuleChatId,
            data: {
              payload: {
                type: "message-updated",
                messageId: socialModuleMessage.id,
              },
            },
            options: {
              headers,
            },
          },
        );
      } catch (error) {
        logger.error(error);
      }

      return c.json({
        data: socialModuleMessage,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../service";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";

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

      const socialModuleProfile = await socialModuleProfileApi.findById({
        id: socialModuleProfileId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const parsedQuery = c.get("parsedQuery");
      const limit = parsedQuery?.limit || 100;
      const offset = parsedQuery?.offset || 0;
      const orderBy = parsedQuery?.orderBy;

      const socialModuleProfilesToChats =
        await socialModuleProfilesToChatsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: socialModuleProfileId,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!socialModuleProfilesToChats?.length) {
        return c.json({
          data: [],
        });
      }

      const socialModuleChats = await socialModuleChatApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats?.map(
                  (socialModuleProfileToChat) => {
                    return socialModuleProfileToChat.chatId;
                  },
                ),
              },
            ],
          },
          orderBy,
          limit,
          offset,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: socialModuleChats,
      });
    } catch (error: any) {
      if (error.message?.includes("Configuration error")) {
        throw new HTTPException(500, {
          message: error.message || "Configuration error",
          cause: error,
        });
      }

      if (error.message?.includes("Validation error")) {
        throw new HTTPException(400, {
          message: error.message || "Validation error",
          cause: error,
        });
      }

      if (error.message?.includes("Unauthorized")) {
        throw new HTTPException(403, {
          message: error.message || "Unauthorized",
          cause: error,
        });
      }

      if (error.message?.includes("Not found")) {
        throw new HTTPException(404, {
          message: error.message || "Not found",
          cause: error,
        });
      }

      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}

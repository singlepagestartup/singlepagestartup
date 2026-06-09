import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";

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

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Validation error. Invalid profile payload");
      }

      const socialModuleProfileId =
        typeof data.socialModuleProfileId === "string"
          ? data.socialModuleProfileId.trim()
          : undefined;

      if (!socialModuleProfileId) {
        throw new Error(
          "Validation error. Social module profile id is required",
        );
      }

      const socialModuleProfile =
        await this.service.socialModule.profile.findById({
          id: socialModuleProfileId,
        });

      if (!socialModuleProfile?.id) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const socialModuleProfilesToChats =
        await this.service.socialModule.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: socialModuleProfileId,
                },
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
          },
        });

      if (socialModuleProfilesToChats?.length) {
        return c.json({
          data: socialModuleProfilesToChats[0],
        });
      }

      const socialModuleProfileToChat =
        await socialModuleProfilesToChatsApi.create({
          data: {
            profileId: socialModuleProfileId,
            chatId: socialModuleChatId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      return c.json({
        data: socialModuleProfileToChat,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

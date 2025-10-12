import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { api } from "@sps/rbac/models/subject/sdk/server";

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

      const socialModuleChats = await api.socialModuleProfileFindByIdChatFind({
        id,
        socialModuleProfileId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      const socialModuleChat = socialModuleChats.find(
        (socialModuleChat) => socialModuleChat.id === socialModuleChatId,
      );

      if (!socialModuleChat) {
        throw new Error(
          "Not found error. Requested social-module chat not found",
        );
      }

      return c.json({
        data: socialModuleChat,
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

import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
// import { api } from "@sps/rbac/models/subject/sdk/server";
// import { api as agentModuleAgentApi } from "@sps/agent/models/agent/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
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

      const socialModuleMessage = await socialModuleMessageApi.findById({
        id: socialModuleMessageId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage?.description) {
        throw new Error(
          "Not found. Social module message description not found",
        );
      }

      // const agentModuleAgentAiOpenAiGpt4oMini =
      //   await agentModuleAgentApi.aiOpenAiGpt4oMini({
      //     data: {
      //       description: socialModuleMessage.description,
      //     },
      //     options: {
      //       headers: {
      //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //       },
      //     },
      //   });

      // const message =
      //   await api.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      //     id,
      //     socialModuleProfileId,
      //     socialModuleChatId,
      //     data: {
      //       description: agentModuleAgentAiOpenAiGpt4oMini.output_text,
      //     },
      //     options: {
      //       headers: {
      //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      //       },
      //     },
      //   });

      const message = "test";

      return c.json({
        data: message,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

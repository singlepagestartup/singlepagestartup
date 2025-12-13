import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as IRbacModuleAction } from "@sps/rbac/models/action/sdk/model";
import { match } from "path-to-regexp";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleChatsToActionsApi } from "@sps/social/relations/chats-to-actions/sdk/server";
import { api as socialModuleProfilesToChatsToApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleProfilesToMessagesToApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as socialModuleProfilesToActionsToApi } from "@sps/social/relations/profiles-to-actions/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data: {
        rbacModuleAction: IRbacModuleAction;
      };
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      await this.onAction(c, { data });
      await this.onMessage(c, { data });

      return c.json({
        data: true,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }

  async onAction(
    c: Context,
    props: {
      data: {
        rbacModuleAction: IRbacModuleAction;
      };
    },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const template =
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profile.id]/chats/[social.chat.id]/actions".replace(
        /\[(.+?)\]/g,
        (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
      );
    const matcher = match(template, {
      decode: decodeURIComponent,
      end: true,
    });

    const result = matcher(props.data.rbacModuleAction.payload?.route);

    if (!result) {
      return c.json({
        data: false,
      });
    }

    if (
      !["POST", "PATCH"].includes(props.data.rbacModuleAction.payload?.method)
    ) {
      return c.json({
        data: false,
      });
    }

    const socialModuleAction = await socialModuleActionApi.findById({
      id: props.data.rbacModuleAction.payload?.result.data.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!socialModuleAction) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChatsToActions = await socialModuleChatsToActionsApi.find(
      {
        params: {
          filters: {
            and: [
              {
                column: "actionId",
                method: "eq",
                value: socialModuleAction.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      },
    );

    if (!socialModuleChatsToActions?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChat = await socialModuleChatApi.findById({
      id: socialModuleChatsToActions[0].chatId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!socialModuleChat) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsToApi.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: socialModuleChat.id,
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
        data: false,
      });
    }

    const socialModuleProfiles = await socialModuleProfileApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: socialModuleProfilesToChats.map(
                (entity) => entity.profileId,
              ),
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

    if (!socialModuleProfiles?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfilesToActions =
      await socialModuleProfilesToActionsToApi.find({
        params: {
          filters: {
            and: [
              {
                column: "actionId",
                method: "eq",
                value: socialModuleAction.id,
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

    if (!socialModuleProfilesToActions?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfileToAction = socialModuleProfilesToActions[0];

    const messageFromSocialModuleProfile = socialModuleProfiles.find(
      (profile) => profile.id === socialModuleProfileToAction.profileId,
    );

    const shouldReplySocialModuleProfiles = socialModuleProfiles.filter(
      (profile) =>
        ["artificial-intelligence", "agent"].includes(profile.variant),
    );

    if (!shouldReplySocialModuleProfiles.length) {
      return c.json({
        data: false,
      });
    }

    for (const shouldReplySocialModuleProfile of shouldReplySocialModuleProfiles) {
      if (
        shouldReplySocialModuleProfile.id === messageFromSocialModuleProfile?.id
      ) {
        continue;
      }

      await this.service.agentSocialModuleProfileHandler({
        shouldReplySocialModuleProfile,
        socialModuleChat,
        socialModuleAction,
        messageFromSocialModuleProfile: messageFromSocialModuleProfile || null,
      });
    }

    return c.json({
      data: true,
    });
  }

  async onMessage(
    c: Context,
    props: {
      data: {
        rbacModuleAction: IRbacModuleAction;
      };
    },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const template =
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profile.id]/chats/[social.chat.id]/messages".replace(
        /\[(.+?)\]/g,
        (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
      );
    const matcher = match(template, {
      decode: decodeURIComponent,
      end: true,
    });

    const result = matcher(props.data.rbacModuleAction.payload?.route);

    if (!result) {
      return c.json({
        data: false,
      });
    }

    if (
      !["POST", "PATCH"].includes(props.data.rbacModuleAction.payload?.method)
    ) {
      return c.json({
        data: false,
      });
    }

    const socialModuleMessage = await socialModuleMessageApi.findById({
      id: props.data.rbacModuleAction.payload?.result.data.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!socialModuleMessage) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChatsToMessages =
      await socialModuleChatsToMessagesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (!socialModuleChatsToMessages?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChat = await socialModuleChatApi.findById({
      id: socialModuleChatsToMessages[0].chatId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!socialModuleChat) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsToApi.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: socialModuleChat.id,
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
        data: false,
      });
    }

    const socialModuleProfiles = await socialModuleProfileApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: socialModuleProfilesToChats.map(
                (entity) => entity.profileId,
              ),
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

    if (!socialModuleProfiles?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfilesToMessages =
      await socialModuleProfilesToMessagesToApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (!socialModuleProfilesToMessages?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfileToMessage = socialModuleProfilesToMessages[0];

    const messageFromSocialModuleProfile = socialModuleProfiles.find(
      (profile) => profile.id === socialModuleProfileToMessage.profileId,
    );

    if (!messageFromSocialModuleProfile) {
      throw new Error(
        "Not found error. 'messageFromSocialModuleProfile' not found",
      );
    }

    const isMessageFromAutomaticReplySocialModuleProfile = [
      "artificial-intelligence",
      "agent",
    ].includes(messageFromSocialModuleProfile?.variant);

    if (isMessageFromAutomaticReplySocialModuleProfile) {
      return c.json({
        data: false,
      });
    }

    const shouldReplySocialModuleProfiles = socialModuleProfiles.filter(
      (profile) =>
        ["artificial-intelligence", "agent"].includes(profile.variant),
    );

    if (!shouldReplySocialModuleProfiles.length) {
      return c.json({
        data: false,
      });
    }

    if (messageFromSocialModuleProfile) {
      for (const shouldReplySocialModuleProfile of shouldReplySocialModuleProfiles) {
        if (
          shouldReplySocialModuleProfile.id ===
          messageFromSocialModuleProfile.id
        ) {
          continue;
        }

        await this.service.agentSocialModuleProfileHandler({
          shouldReplySocialModuleProfile,
          socialModuleChat,
          socialModuleMessage,
          messageFromSocialModuleProfile: messageFromSocialModuleProfile,
        });
      }
    }

    return c.json({
      data: true,
    });
  }
}

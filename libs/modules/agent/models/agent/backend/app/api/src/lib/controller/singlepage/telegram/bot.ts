import {
  AUDIO_TRANSCRIPTION_ACTION_TYPE,
  AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY,
  AUDIO_TRANSCRIPTION_METADATA_KEY,
  normalizeRoutePath,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as IRbacModuleAction } from "@sps/rbac/models/action/sdk/model";
import { match } from "path-to-regexp";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  protected matchRoute(route: string | undefined, templates: string[]) {
    const normalizedRoute = normalizeRoutePath(route);

    if (!normalizedRoute) {
      return null;
    }

    for (const template of templates) {
      const normalizedTemplate = template.replace(
        /\[(.+?)\]/g,
        (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
      );
      const matcher = match(normalizedTemplate, {
        decode: decodeURIComponent,
        end: true,
      });
      const result = matcher(normalizedRoute);

      if (result) {
        return result;
      }
    }

    return null;
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

    const result = matcher(
      normalizeRoutePath(props.data.rbacModuleAction.payload?.route),
    );

    if (!result) {
      return c.json({
        data: false,
      });
    }

    if (
      !["POST", "PATCH", "DELETE"].includes(
        props.data.rbacModuleAction.payload?.method,
      )
    ) {
      return c.json({
        data: false,
      });
    }

    const actionId = props.data.rbacModuleAction.payload?.result?.data?.id;

    if (!actionId) {
      return c.json({
        data: false,
      });
    }

    let socialModuleAction;
    try {
      socialModuleAction = await this.service.socialModule.action.findById({
        id: actionId,
      });
    } catch (error) {
      return c.json({
        data: false,
      });
    }

    if (!socialModuleAction) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChatsToActions =
      await this.service.socialModule.chatsToActions.find({
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
      });

    if (!socialModuleChatsToActions?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleChat = await this.service.socialModule.chat.findById({
      id: socialModuleChatsToActions[0].chatId,
    });

    if (!socialModuleChat) {
      return c.json({
        data: false,
      });
    }

    const actionPayload = socialModuleAction.payload as {
      type?: string;
      messageId?: string;
      messageSourceSystemId?: string | number;
      chatSourceSystemId?: string | number;
      message?: {
        description?: string | null;
        id?: string;
        metadata?: Record<string, unknown> | null;
        sourceSystemId?: string | null;
      };
    };

    if (actionPayload?.type === AUDIO_TRANSCRIPTION_ACTION_TYPE) {
      const socialModuleMessage = actionPayload.message;

      if (
        !socialModuleMessage?.id ||
        !this.isAudioTranscriptionCompletedMessage(socialModuleMessage)
      ) {
        return c.json({
          data: false,
        });
      }

      const handled = await this.dispatchAutomaticReplyForMessage({
        socialModuleChat,
        socialModuleMessage: socialModuleMessage as any,
      });

      return c.json({
        data: handled,
      });
    }

    if (actionPayload?.type === "update") {
      const socialModuleMessage = actionPayload.message;

      if (!socialModuleMessage?.id) {
        return c.json({
          data: false,
        });
      }

      await this.service.notificationMessageUpdate({
        socialModuleChat,
        socialModuleMessage: socialModuleMessage as any,
      });

      return c.json({
        data: true,
      });
    }

    if (actionPayload?.type === "delete") {
      const chatSourceSystemId = socialModuleChat.sourceSystemId;
      const messageSourceSystemId =
        actionPayload.message?.sourceSystemId || null;

      if (!chatSourceSystemId || !messageSourceSystemId) {
        return c.json({
          data: false,
        });
      }

      await this.service.notificationMessageDelete({
        chatSourceSystemId,
        messageSourceSystemId,
      });

      return c.json({
        data: true,
      });
    }

    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
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
      });

    if (!socialModuleProfilesToChats?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfiles = await this.service.socialModule.profile.find({
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
    });

    if (!socialModuleProfiles?.length) {
      return c.json({
        data: false,
      });
    }

    const socialModuleProfilesToActions =
      await this.service.socialModule.profilesToActions.find({
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

    const result = this.matchRoute(props.data.rbacModuleAction.payload?.route, [
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profile.id]/chats/[social.chat.id]/messages",
      "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profile.id]/chats/[social.chat.id]/threads/[social.thread.id]/messages",
    ]);

    if (!result) {
      return c.json({
        data: false,
      });
    }

    if (props.data.rbacModuleAction.payload?.method !== "POST") {
      return c.json({
        data: false,
      });
    }

    const socialModuleMessage =
      await this.service.socialModule.message.findById({
        id: props.data.rbacModuleAction.payload?.result.data.id,
      });

    if (!socialModuleMessage) {
      return c.json({
        data: false,
      });
    }

    const matchedSocialModuleThreadId = result.params.social_thread_id;
    const socialModuleThreadId =
      typeof matchedSocialModuleThreadId === "string"
        ? matchedSocialModuleThreadId
        : undefined;

    const handled = await this.dispatchAutomaticReplyForMessage({
      socialModuleMessage,
      socialModuleThreadId,
    });

    return c.json({
      data: handled,
    });
  }

  protected isAudioTranscriptionCompletedMessage(message: {
    metadata?: Record<string, unknown> | null;
  }) {
    const metadata = message.metadata;

    if (!metadata || typeof metadata !== "object") {
      return false;
    }

    const audioTranscription =
      metadata[AUDIO_TRANSCRIPTION_METADATA_KEY] ||
      metadata[AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY];

    return Boolean(
      audioTranscription &&
        typeof audioTranscription === "object" &&
        (audioTranscription as Record<string, unknown>).status ===
          "completed" &&
        (audioTranscription as Record<string, unknown>).agentTrigger ===
          AUDIO_TRANSCRIPTION_ACTION_TYPE,
    );
  }

  protected async dispatchAutomaticReplyForMessage(props: {
    socialModuleChat?: any;
    socialModuleMessage: any;
    socialModuleThreadId?: string;
  }) {
    if (this.isAudioTranscriptionPendingOrFailed(props.socialModuleMessage)) {
      return false;
    }

    if (!props.socialModuleMessage.description?.trim()) {
      return false;
    }

    let socialModuleChat = props.socialModuleChat;

    if (!socialModuleChat) {
      const socialModuleChatsToMessages =
        await this.service.socialModule.chatsToMessages.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: props.socialModuleMessage.id,
                },
              ],
            },
          },
        });

      if (!socialModuleChatsToMessages?.length) {
        return false;
      }

      socialModuleChat = await this.service.socialModule.chat.findById({
        id: socialModuleChatsToMessages[0].chatId,
      });
    }

    if (!socialModuleChat) {
      return false;
    }

    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
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
      });

    if (!socialModuleProfilesToChats?.length) {
      return false;
    }

    const socialModuleProfiles = await this.service.socialModule.profile.find({
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
    });

    if (!socialModuleProfiles?.length) {
      return false;
    }

    const socialModuleProfilesToMessages =
      await this.service.socialModule.profilesToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessage.id,
              },
            ],
          },
        },
      });

    if (!socialModuleProfilesToMessages?.length) {
      return false;
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
      return false;
    }

    const shouldReplySocialModuleProfiles = socialModuleProfiles.filter(
      (profile) => {
        return ["artificial-intelligence", "agent"].includes(profile.variant);
      },
    );

    if (!shouldReplySocialModuleProfiles.length) {
      return false;
    }

    let handled = false;

    for (const shouldReplySocialModuleProfile of shouldReplySocialModuleProfiles) {
      if (
        shouldReplySocialModuleProfile.id === messageFromSocialModuleProfile.id
      ) {
        continue;
      }

      await this.service.agentSocialModuleProfileHandler({
        shouldReplySocialModuleProfile,
        socialModuleChat,
        socialModuleMessage: props.socialModuleMessage,
        socialModuleThreadId: props.socialModuleThreadId,
        messageFromSocialModuleProfile,
      });
      handled = true;
    }

    return handled;
  }

  protected isAudioTranscriptionPendingOrFailed(message: {
    metadata?: Record<string, unknown> | null;
  }) {
    const metadata = message.metadata;

    if (!metadata || typeof metadata !== "object") {
      return false;
    }

    const audioTranscription =
      metadata[AUDIO_TRANSCRIPTION_METADATA_KEY] ||
      metadata[AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY];

    if (!audioTranscription || typeof audioTranscription !== "object") {
      return false;
    }

    const status = (audioTranscription as Record<string, unknown>).status;

    return status === "processing" || status === "failed";
  }
}

import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { createId } from "@paralleldrive/cuid2";
import { internationalization } from "@sps/shared-configuration";

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

      const agentSubjectId =
        typeof data.agentSubjectId === "string"
          ? data.agentSubjectId.trim()
          : undefined;
      const socialModuleProfileId =
        typeof data.socialModuleProfileId === "string"
          ? data.socialModuleProfileId.trim()
          : undefined;

      if (agentSubjectId) {
        const socialModuleProfileToChat = await this.createAgentProfileForChat({
          agentSubjectId,
          socialModuleChatId,
        });

        return c.json({
          data: socialModuleProfileToChat,
        });
      }

      if (!socialModuleProfileId) {
        throw new Error(
          "Validation error. Social module profile id or agent subject id is required",
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

  private async createAgentProfileForChat(props: {
    agentSubjectId: string;
    socialModuleChatId: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const agentSubject = await this.service.findById({
      id: props.agentSubjectId,
    });

    if (!agentSubject?.id) {
      throw new Error("Not found error. Requested agent subject not found");
    }

    if (agentSubject.variant !== "agent") {
      throw new Error(
        'Validation error. Requested subject must have variant="agent"',
      );
    }

    const existingAgentProfileRelation =
      await this.findExistingAgentProfileChatRelation({
        agentSubjectId: props.agentSubjectId,
        socialModuleChatId: props.socialModuleChatId,
      });

    if (existingAgentProfileRelation) {
      return existingAgentProfileRelation;
    }

    const slugBase = this.toSlug(agentSubject.slug || "agent");
    const title = agentSubject.slug || "Agent";
    const defaultLanguageCode = internationalization.defaultLanguage.code;
    const socialModuleProfile = await socialModuleProfileApi.create({
      data: {
        variant: "artificial-intelligence",
        className: "",
        adminTitle: title,
        slug: `${slugBase}-${createId().slice(0, 8)}`,
        title: {
          [defaultLanguageCode]: title,
        },
        subtitle: {},
        description: {},
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    await subjectsToSocialModuleProfilesApi.create({
      data: {
        subjectId: props.agentSubjectId,
        socialModuleProfileId: socialModuleProfile.id,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    return socialModuleProfilesToChatsApi.create({
      data: {
        profileId: socialModuleProfile.id,
        chatId: props.socialModuleChatId,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });
  }

  private async findExistingAgentProfileChatRelation(props: {
    agentSubjectId: string;
    socialModuleChatId: string;
  }) {
    const subjectProfileRelations =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.agentSubjectId,
              },
            ],
          },
        },
      });
    const profileIds =
      subjectProfileRelations
        ?.map((relation) => relation.socialModuleProfileId)
        .filter((profileId): profileId is string => Boolean(profileId)) || [];

    if (!profileIds.length) {
      return null;
    }

    const [profiles, profileChatRelations] = await Promise.all([
      this.service.socialModule.profile.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: profileIds,
              },
              {
                column: "variant",
                method: "eq",
                value: "artificial-intelligence",
              },
            ],
          },
        },
      }),
      this.service.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "inArray",
                value: profileIds,
              },
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
          limit: 1,
        },
      }),
    ]);

    const artificialIntelligenceProfileIds = new Set(
      (profiles || [])
        .map((profile) => profile.id)
        .filter((profileId): profileId is string => Boolean(profileId)),
    );

    return (
      profileChatRelations?.find((relation) => {
        return artificialIntelligenceProfileIds.has(relation.profileId);
      }) || null
    );
  }

  private toSlug(value: string) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "agent"
    );
  }
}

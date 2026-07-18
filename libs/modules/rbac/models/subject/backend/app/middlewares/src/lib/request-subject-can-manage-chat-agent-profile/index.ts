import { getHttpErrorType } from "@sps/backend-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

type IService = {
  find(props: unknown): Promise<Array<{ id?: string; variant?: string }>>;
  socialModuleChatLifecycleAssertSubjectOwnsChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }): Promise<unknown>;
  socialModule: {
    profile: {
      findById(props: {
        id: string;
      }): Promise<{ id?: string; variant?: string } | null>;
    };
    profilesToChats: {
      find(
        props: unknown,
      ): Promise<Array<{ id?: string; profileId?: string; chatId?: string }>>;
    };
    profilesToSkills: {
      find(
        props: unknown,
      ): Promise<Array<{ id?: string; profileId?: string; skillId?: string }>>;
    };
    profilesToKnowledgeModuleDocuments: {
      find(props: unknown): Promise<
        Array<{
          id?: string;
          profileId?: string;
          knowledgeModuleDocumentId?: string;
        }>
      >;
    };
  };
  subjectsToSocialModuleProfiles: {
    find(props: unknown): Promise<
      Array<{
        id?: string;
        subjectId?: string;
        socialModuleProfileId?: string;
      }>
    >;
  };
};

function requireParam(
  c: Parameters<MiddlewareHandler<any, any, {}>>[0],
  name: string,
) {
  const value = c.req.param(name);

  if (!value) {
    throw new Error(`Validation error. No ${name} provided`);
  }

  return value;
}

export class Middleware {
  constructor(private readonly service: IService) {}

  init(
    options: { requireLinkedSkill?: boolean } = {},
  ): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      try {
        const id = requireParam(c, "id");
        const socialModuleProfileId = requireParam(c, "socialModuleProfileId");
        const socialModuleChatId = requireParam(c, "socialModuleChatId");
        const targetSocialModuleProfileId = requireParam(
          c,
          "targetSocialModuleProfileId",
        );
        const socialModuleSkillId = c.req.param("socialModuleSkillId");
        const knowledgeModuleDocumentId = c.req.param(
          "knowledgeModuleDocumentId",
        );

        await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
          subjectId: id,
          socialModuleChatId,
        });

        await this.assertRequestingProfileAccess({
          subjectId: id,
          socialModuleProfileId,
        });

        await this.assertTargetAgentProfileAccess({
          targetSocialModuleProfileId,
          socialModuleChatId,
        });

        if (socialModuleSkillId && options.requireLinkedSkill !== false) {
          await this.assertTargetSkillAccess({
            targetSocialModuleProfileId,
            socialModuleSkillId,
          });
        }

        if (knowledgeModuleDocumentId) {
          await this.assertTargetKnowledgeDocumentAccess({
            targetSocialModuleProfileId,
            knowledgeModuleDocumentId,
          });
        }

        return next();
      } catch (error: any) {
        const { status, message, details } = getHttpErrorType(error);
        throw new HTTPException(status, { message, cause: details });
      }
    });
  }

  async assertRequestingProfileAccess(props: {
    subjectId: string;
    socialModuleProfileId: string;
  }) {
    const subjectProfileRelations =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectId,
              },
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!subjectProfileRelations?.length) {
      throw new Error(
        "Authorization error. Requesting social-module profile does not belong to subject",
      );
    }
  }

  async assertTargetAgentProfileAccess(props: {
    targetSocialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const targetProfile = await this.service.socialModule.profile.findById({
      id: props.targetSocialModuleProfileId,
    });

    if (!targetProfile?.id) {
      throw new Error(
        "Not found error. Target social-module profile not found",
      );
    }

    if (targetProfile.variant !== "artificial-intelligence") {
      throw new Error(
        'Authorization error. Target social-module profile must have variant="artificial-intelligence"',
      );
    }

    const [targetChatRelations, subjectProfileRelations] = await Promise.all([
      this.service.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.targetSocialModuleProfileId,
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
      this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: props.targetSocialModuleProfileId,
              },
            ],
          },
        },
      }),
    ]);

    if (!targetChatRelations?.length) {
      throw new Error(
        "Authorization error. Target social-module profile is not connected to chat",
      );
    }

    const targetSubjectIds =
      subjectProfileRelations
        ?.map((relation) => relation.subjectId)
        .filter((subjectId): subjectId is string => Boolean(subjectId)) || [];

    if (!targetSubjectIds.length) {
      throw new Error(
        "Authorization error. Target social-module profile is not linked to an RBAC subject",
      );
    }

    const targetSubjects = await this.service.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: targetSubjectIds,
            },
            {
              column: "variant",
              method: "eq",
              value: "agent",
            },
          ],
        },
      },
    });

    if (!targetSubjects?.length) {
      throw new Error(
        'Authorization error. Target social-module profile must be linked to rbac.subject variant="agent"',
      );
    }
  }

  async assertTargetSkillAccess(props: {
    targetSocialModuleProfileId: string;
    socialModuleSkillId: string;
  }) {
    const relations = await this.service.socialModule.profilesToSkills.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.targetSocialModuleProfileId,
            },
            {
              column: "skillId",
              method: "eq",
              value: props.socialModuleSkillId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested skill is not linked to target profile",
      );
    }
  }

  async assertTargetKnowledgeDocumentAccess(props: {
    targetSocialModuleProfileId: string;
    knowledgeModuleDocumentId: string;
  }) {
    const relations =
      await this.service.socialModule.profilesToKnowledgeModuleDocuments.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.targetSocialModuleProfileId,
              },
              {
                column: "knowledgeModuleDocumentId",
                method: "eq",
                value: props.knowledgeModuleDocumentId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested Knowledge document is not linked to target profile",
      );
    }
  }
}

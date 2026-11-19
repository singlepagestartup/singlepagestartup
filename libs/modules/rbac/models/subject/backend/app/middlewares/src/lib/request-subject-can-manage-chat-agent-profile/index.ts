import { getHttpErrorType } from "@sps/backend-utils";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";

export interface IMiddlewareGeneric {}

import type { SubjectServiceDependencies } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage";

type IService = SubjectServiceDependencies<
  "find" | "socialModuleChatLifecycleAssertSubjectOwnsChat"
>;

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
        const knowledgeModuleSourceId = c.req.param("knowledgeModuleSourceId");

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

        if (knowledgeModuleSourceId) {
          await this.assertTargetKnowledgeSourceAccess({
            targetSocialModuleProfileId,
            knowledgeModuleSourceId,
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
      await this.service.module.subjectsToSocialModuleProfiles.find({
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
    const targetProfile = await this.service.modules.social.profile.findById({
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
      this.service.modules.social.profilesToChats.find({
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
      this.service.module.subjectsToSocialModuleProfiles.find({
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
    const relations = await this.service.modules.social.profilesToSkills.find({
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

  async assertTargetKnowledgeSourceAccess(props: {
    targetSocialModuleProfileId: string;
    knowledgeModuleSourceId: string;
  }) {
    const relations =
      await this.service.modules.social.profilesToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.targetSocialModuleProfileId,
              },
              {
                column: "knowledgeModuleSourceId",
                method: "eq",
                value: props.knowledgeModuleSourceId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested Knowledge Source is not linked to target profile",
      );
    }
  }
}

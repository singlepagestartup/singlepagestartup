import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import { findProfileSkillIds, requireParam } from "./helpers";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const targetSocialModuleProfileId = requireParam(
        c,
        "targetSocialModuleProfileId",
      );
      const socialModuleSkillId = requireParam(c, "socialModuleSkillId");
      const skill = await this.service.socialModule.skill.findById({
        id: socialModuleSkillId,
      });

      if (!skill?.id) {
        throw new Error("Not found error. Requested skill not found");
      }

      const relations = await this.service.socialModule.profilesToSkills.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: targetSocialModuleProfileId,
              },
              { column: "skillId", method: "eq", value: socialModuleSkillId },
            ],
          },
          limit: 1,
        },
      });

      if (!relations?.length) {
        const linkedIds = await findProfileSkillIds({
          service: this.service,
          targetSocialModuleProfileId,
        });
        await this.service.socialModule.profilesToSkills.create({
          data: {
            variant: "default",
            className: "",
            orderIndex: linkedIds.length,
            profileId: targetSocialModuleProfileId,
            skillId: socialModuleSkillId,
          },
        });
      }

      return c.json({ data: skill });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

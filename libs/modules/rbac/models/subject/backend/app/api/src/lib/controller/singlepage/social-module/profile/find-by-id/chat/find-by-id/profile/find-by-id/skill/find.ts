import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import { findProfileSkillIds, requireParam } from "./helpers";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const targetSocialModuleProfileId = requireParam(
        c,
        "targetSocialModuleProfileId",
      );
      const skillIds = await findProfileSkillIds({
        service: this.service,
        targetSocialModuleProfileId,
      });

      if (!skillIds.length) {
        return c.json({ data: [] });
      }

      const skills = await this.service.socialModule.skill.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: skillIds,
              },
            ],
          },
        },
      });
      const skillsById = new Map(
        (skills || []).map((skill) => [skill.id, skill]),
      );

      return c.json({
        data: skillIds
          .map((skillId) => skillsById.get(skillId))
          .filter((skill) => {
            return Boolean(skill && skill.status !== "archived");
          }),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

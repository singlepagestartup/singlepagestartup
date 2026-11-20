import {
  getHttpErrorType,
  storeEmployeeSkillCommand,
} from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import { findProfileSkillIds, parsePagination, requireParam } from "./helpers";

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
      const pagination = parsePagination(c);
      const skillIds = await findProfileSkillIds({
        service: this.service,
        targetSocialModuleProfileId,
        ...pagination,
      });

      if (!skillIds.length) {
        return c.json({ data: [] });
      }

      const skills = await this.service.modules.social.skill.find({
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
      const employee = Boolean(c.get("storeEmployeeTrainingStoreId"));
      const linked = skillIds.flatMap((skillId) => {
        const skill = skillsById.get(skillId);
        return skill ? [skill] : [];
      });
      const data = employee
        ? linked.map((skill) => ({
            ...skill,
            slug: storeEmployeeSkillCommand(skill.slug),
          }))
        : linked;
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

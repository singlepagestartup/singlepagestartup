import {
  getHttpErrorType,
  getPrivateAIChatSkillProfileId,
  storeEmployeeSkillCommand,
  storeEmployeeSkillSlug,
} from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import {
  normalizeSkillPayload,
  parseRequestBody,
  requireParam,
} from "./helpers";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const socialModuleSkillId = requireParam(c, "socialModuleSkillId");
      const body = await parseRequestBody(c);
      const payload = normalizeSkillPayload(body);
      const currentSkill = await this.service.modules.social.skill.findById({
        id: socialModuleSkillId,
      });

      if (!currentSkill?.id) {
        throw new Error("Not found error. Requested skill not found");
      }
      const employee = Boolean(c.get("storeEmployeeTrainingStoreId"));
      const profileId = c.req.param("targetSocialModuleProfileId");
      const owner = getPrivateAIChatSkillProfileId(currentSkill.slug);
      let slug = payload.slug;
      if (employee) {
        if (!profileId || owner !== profileId) {
          throw new Error(
            "Forbidden error. Only this employee's private skills can be edited",
          );
        }
        if (
          storeEmployeeSkillCommand(currentSkill.slug) !== currentSkill.slug
        ) {
          slug = storeEmployeeSkillSlug(profileId, slug);
        } else if (slug !== currentSkill.slug) {
          throw new Error(
            "Validation error. A private skill's command cannot be renamed.",
          );
        }
      }
      if (
        (owner && slug !== currentSkill.slug && !employee) ||
        (getPrivateAIChatSkillProfileId(slug) &&
          getPrivateAIChatSkillProfileId(slug) !== owner)
      ) {
        throw new Error(
          "Validation error. A private skill's command cannot be renamed.",
        );
      }

      const updatedSkill = await this.service.modules.social.skill.update({
        id: socialModuleSkillId,
        data: {
          variant: currentSkill.variant || "default",
          className: currentSkill.className || "",
          title: payload.title,
          slug,
          adminTitle: payload.title,
          description: payload.description,
        },
      });

      const data =
        employee && updatedSkill
          ? {
              ...updatedSkill,
              slug: storeEmployeeSkillCommand(updatedSkill.slug),
            }
          : updatedSkill;
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

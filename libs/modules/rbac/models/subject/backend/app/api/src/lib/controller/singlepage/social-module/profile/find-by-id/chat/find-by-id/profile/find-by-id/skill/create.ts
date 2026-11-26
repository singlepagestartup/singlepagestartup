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
  findProfileSkillIds,
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
      const targetSocialModuleProfileId = requireParam(
        c,
        "targetSocialModuleProfileId",
      );
      const body = await parseRequestBody(c);
      const payload = normalizeSkillPayload(body);
      const employee = Boolean(c.get("storeEmployeeTrainingStoreId"));
      const slug = employee
        ? storeEmployeeSkillSlug(targetSocialModuleProfileId, payload.slug)
        : payload.slug;
      const privateSkillProfileId = getPrivateAIChatSkillProfileId(slug);
      if (
        privateSkillProfileId &&
        privateSkillProfileId !== targetSocialModuleProfileId
      )
        throw new Error(
          "Authorization error. This private skill belongs to another profile.",
        );
      const skillIds = await findProfileSkillIds({
        service: this.service,
        targetSocialModuleProfileId,
      });
      const skill = await this.service.modules.social.skill.create({
        data: {
          variant: "default",
          className: "",
          title: payload.title,
          slug,
          adminTitle: payload.title,
          description: payload.description,
        },
      });

      await this.service.modules.social.profilesToSkills.create({
        data: {
          variant: "default",
          className: "",
          orderIndex: this.toOrderIndex(
            body.data?.orderIndex ?? body.orderIndex,
            skillIds.length,
          ),
          profileId: targetSocialModuleProfileId,
          skillId: skill.id,
        },
      });

      const data = employee
        ? { ...skill, slug: storeEmployeeSkillCommand(skill.slug) }
        : skill;
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private toOrderIndex(value: unknown, fallback: number) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return fallback;
    }

    return Math.floor(numberValue);
  }
}

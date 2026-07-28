import { getHttpErrorType } from "@sps/backend-utils";
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
      const currentSkill = await this.service.socialModule.skill.findById({
        id: socialModuleSkillId,
      });

      if (!currentSkill?.id) {
        throw new Error("Not found error. Requested skill not found");
      }

      const updatedSkill = await this.service.socialModule.skill.update({
        id: socialModuleSkillId,
        data: {
          variant: currentSkill.variant || "default",
          className: currentSkill.className || "",
          title: payload.title,
          slug: payload.slug,
          adminTitle: payload.title,
          description: payload.description,
        },
      });

      return c.json({ data: updatedSkill });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

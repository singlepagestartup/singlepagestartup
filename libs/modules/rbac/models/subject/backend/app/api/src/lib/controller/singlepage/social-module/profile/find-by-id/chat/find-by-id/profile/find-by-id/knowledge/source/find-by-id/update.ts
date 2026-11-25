import { getHttpErrorType } from "@sps/backend-utils";
import { Service as ProfileSources } from "../../../../../../../../../../../../service/singlepage/social-module/profile/knowledge/sources";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../../service";
import { readSourceDraft } from "../helpers";

export class Handler {
  service: Service;
  knowledgeService: ProfileSources;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new ProfileSources(service);
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const knowledgeModuleSourceId = c.req.param("knowledgeModuleSourceId");

      if (!knowledgeModuleSourceId) {
        throw new Error(
          "Validation error. No knowledgeModuleSourceId provided",
        );
      }

      const data = await readSourceDraft(c);
      const document = await this.knowledgeService.edit({
        ...data,
        sourceId: knowledgeModuleSourceId,
      });
      return c.json({
        data: document.source,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

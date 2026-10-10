import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service } from "../../../../../../../service";
import {
  findProfileKnowledgeSourceRelations,
  getKnowledgeSourceIds,
  requireParam,
  resolveKnowledgeSourceProfileId,
} from "./helpers";

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new KnowledgeService();
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const socialModuleProfileId = requireParam(c, "socialModuleProfileId");
      const documentProfileId = await resolveKnowledgeSourceProfileId({
        service: this.service,
        socialModuleProfileId,
        targetSocialModuleProfileId: c.req.query("targetSocialModuleProfileId"),
        socialModuleChatId: c.req.query("socialModuleChatId"),
      });
      const relations = await findProfileKnowledgeSourceRelations({
        service: this.service,
        socialModuleProfileId: documentProfileId,
      });
      const sourceIds = getKnowledgeSourceIds(relations || []);
      const documents = await this.knowledgeService.listSources({
        sourceIds,
      });

      return c.json({ data: documents });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

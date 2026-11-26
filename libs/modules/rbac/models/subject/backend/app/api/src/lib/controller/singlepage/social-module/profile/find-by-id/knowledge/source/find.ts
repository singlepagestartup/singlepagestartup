import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service } from "../../../../../../../service";
import {
  findProfileKnowledgeSourceRelations,
  getKnowledgeSourceIds,
  requireParam,
  resolveKnowledgeSourceScope,
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
      const scope = await resolveKnowledgeSourceScope({
        service: this.service,
        subjectId: requireParam(c, "id"),
        socialModuleProfileId,
        targetSocialModuleProfileId: c.req.query("targetSocialModuleProfileId"),
        socialModuleChatId: c.req.query("socialModuleChatId"),
      });
      const relations = await findProfileKnowledgeSourceRelations({
        service: this.service,
        socialModuleProfileId: scope.profileId,
      });
      let visible = relations;
      if (scope.storeId) {
        visible = relations.filter(
          (link) =>
            link.variant === "default" &&
            (!link.storeId || link.storeId === scope.storeId) &&
            !link.offerId &&
            !link.projectId,
        );
      }
      const sourceIds = getKnowledgeSourceIds(visible || []);
      const documents = await this.knowledgeService.listSources({
        sourceIds,
      });

      const data = scope.storeId
        ? documents.filter(({ variant }) => variant === "default")
        : documents.filter(({ variant }) => variant !== "customer-memory");
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

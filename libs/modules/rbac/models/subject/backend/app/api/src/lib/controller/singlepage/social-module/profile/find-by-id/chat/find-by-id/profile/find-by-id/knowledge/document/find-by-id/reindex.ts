import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../../service";

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new KnowledgeService();
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const knowledgeModuleDocumentId = c.req.param(
        "knowledgeModuleDocumentId",
      );

      if (!knowledgeModuleDocumentId) {
        throw new Error(
          "Validation error. No knowledgeModuleDocumentId provided",
        );
      }

      const index = await this.knowledgeService.reindexDocument(
        knowledgeModuleDocumentId,
      );

      return c.json({ data: index });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

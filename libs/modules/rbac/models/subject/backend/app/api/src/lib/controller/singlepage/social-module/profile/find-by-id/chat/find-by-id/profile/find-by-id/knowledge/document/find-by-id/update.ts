import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../../service";
import { toText } from "../helpers";

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

      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          description?: unknown;
        };
        title?: unknown;
        description?: unknown;
      };
      const data = body.data || body;
      const title = toText(data.title).trim();
      const description = toText(data.description);

      if (!title) {
        throw new Error(
          "Validation error. Knowledge document title is required",
        );
      }

      const document = await this.knowledgeService.updateDocument({
        documentId: knowledgeModuleDocumentId,
        title,
        description,
      });

      return c.json({ data: document });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

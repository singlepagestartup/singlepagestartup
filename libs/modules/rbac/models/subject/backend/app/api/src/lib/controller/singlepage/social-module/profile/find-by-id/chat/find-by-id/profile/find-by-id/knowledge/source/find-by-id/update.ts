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
      const knowledgeModuleSourceId = c.req.param("knowledgeModuleSourceId");

      if (!knowledgeModuleSourceId) {
        throw new Error(
          "Validation error. No knowledgeModuleSourceId provided",
        );
      }

      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          content?: unknown;
        };
        title?: unknown;
        content?: unknown;
      };
      const data = body.data || body;
      const title = toText(data.title).trim();
      const content = toText(data.content);

      if (!title) {
        throw new Error("Validation error. Knowledge Source title is required");
      }

      const document = await this.knowledgeService.updateSource({
        sourceId: knowledgeModuleSourceId,
        title,
        content,
      });

      return c.json({
        data: document.source,
        indexingError: document.indexError,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

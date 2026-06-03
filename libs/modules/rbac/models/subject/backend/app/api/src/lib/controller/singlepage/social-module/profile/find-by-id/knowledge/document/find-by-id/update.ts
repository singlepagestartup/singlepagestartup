import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service } from "../../../../../../../../service";
import { assertProfileKnowledgeDocumentAccess, requireParam } from "../helpers";

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
      const knowledgeModuleDocumentId = requireParam(
        c,
        "knowledgeModuleDocumentId",
      );
      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          description?: unknown;
        };
        title?: unknown;
        description?: unknown;
      };
      const data = body.data || body;
      const title = this.toText(data.title).trim();
      const description = this.toText(data.description);

      if (!title) {
        throw new Error(
          "Validation error. Knowledge document title is required",
        );
      }

      await assertProfileKnowledgeDocumentAccess({
        service: this.service,
        socialModuleProfileId,
        knowledgeModuleDocumentId,
        targetSocialModuleProfileId: c.req.query("targetSocialModuleProfileId"),
        socialModuleChatId: c.req.query("socialModuleChatId"),
      });

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

  private toText(value: unknown) {
    if (typeof value === "string") {
      return value;
    }

    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }
}

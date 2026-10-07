import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service } from "../../../../../../../../service";
import { assertProfileKnowledgeSourceAccess, requireParam } from "../helpers";

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
      const knowledgeModuleSourceId = requireParam(
        c,
        "knowledgeModuleSourceId",
      );
      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          content?: unknown;
        };
        title?: unknown;
        content?: unknown;
      };
      const data = body.data || body;
      const title = this.toText(data.title).trim();
      const content = this.toText(data.content);

      if (!title) {
        throw new Error("Validation error. Knowledge Source title is required");
      }

      await assertProfileKnowledgeSourceAccess({
        service: this.service,
        socialModuleProfileId,
        knowledgeModuleSourceId,
        targetSocialModuleProfileId: c.req.query("targetSocialModuleProfileId"),
        socialModuleChatId: c.req.query("socialModuleChatId"),
      });

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

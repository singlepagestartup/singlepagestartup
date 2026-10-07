import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Service } from "../../../../../../../service";
import { requireParam, resolveKnowledgeSourceProfileId } from "./helpers";

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
      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          content?: unknown;
          orderIndex?: unknown;
        };
        title?: unknown;
        content?: unknown;
        orderIndex?: unknown;
      };
      const data = body.data || body;
      const title = this.toText(data.title).trim();
      const content = this.toText(data.content).trim();

      if (!title) {
        throw new Error("Validation error. Knowledge Source title is required");
      }

      if (!content) {
        throw new Error(
          "Validation error. Knowledge Source content is required",
        );
      }

      const learned = await this.knowledgeService.learnContent({
        slug: this.createSlug(title),
        title,
        content,
        onSourceSaved: async (sourceId) => {
          await this.service.socialModule.profilesToKnowledgeModuleSources.create(
            {
              data: {
                profileId: documentProfileId,
                knowledgeModuleSourceId: sourceId,
                orderIndex: this.toOrderIndex(data.orderIndex),
              },
            },
          );
        },
      });

      return c.json({ data: learned.source });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private createSlug(title: string) {
    const normalizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    return `${normalizedTitle || "knowledge"}-${suffix}`;
  }

  private toMetadata(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private toOrderIndex(value: unknown) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return 0;
    }

    return Math.floor(numberValue);
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

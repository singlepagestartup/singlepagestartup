import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../service";
import { toMetadata, toOrderIndex, toText } from "./helpers";

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new KnowledgeService();
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const targetSocialModuleProfileId = c.req.param(
        "targetSocialModuleProfileId",
      );

      if (!targetSocialModuleProfileId) {
        throw new Error(
          "Validation error. No targetSocialModuleProfileId provided",
        );
      }

      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          description?: unknown;
          orderIndex?: unknown;
          metadata?: unknown;
        };
        title?: unknown;
        description?: unknown;
        orderIndex?: unknown;
        metadata?: unknown;
      };
      const data = body.data || body;
      const title = toText(data.title).trim();
      const description = toText(data.description).trim();

      if (!title) {
        throw new Error(
          "Validation error. Knowledge document title is required",
        );
      }

      if (!description) {
        throw new Error(
          "Validation error. Knowledge document content is required",
        );
      }

      const learned = await this.knowledgeService.learnContent({
        slug: this.createSlug(title),
        title,
        content: description,
        metadata: {
          ...toMetadata(data.metadata),
          source: "chat-profile-sidebar",
          socialModuleProfileId: targetSocialModuleProfileId,
        },
      });

      await this.service.socialModule.profilesToKnowledgeModuleDocuments.create(
        {
          data: {
            variant: "default",
            className: "",
            orderIndex: toOrderIndex(data.orderIndex),
            profileId: targetSocialModuleProfileId,
            knowledgeModuleDocumentId: learned.document.id,
          },
        },
      );

      return c.json({ data: learned.document });
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
}

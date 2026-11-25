import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { z } from "zod";
import { Service } from "../../../../../../../service";
import { Service as ProfileSources } from "../../../../../../../service/singlepage/social-module/profile/knowledge/sources";
import { requireParam, resolveKnowledgeSourceScope } from "./helpers";

export class Handler {
  service: Service;
  knowledge: ProfileSources;

  constructor(service: Service) {
    this.service = service;
    this.knowledge = new ProfileSources(service);
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const socialModuleProfileId = requireParam(c, "socialModuleProfileId");
      const subjectId = requireParam(c, "id");
      const scope = await resolveKnowledgeSourceScope({
        service: this.service,
        subjectId,
        socialModuleProfileId,
        targetSocialModuleProfileId: c.req.query("targetSocialModuleProfileId"),
        socialModuleChatId: c.req.query("socialModuleChatId"),
      });
      const body = (await c.req.json()) as {
        data?: {
          title?: unknown;
          content?: unknown;
          orderIndex?: unknown;
          operationKey?: unknown;
        };
        title?: unknown;
        content?: unknown;
        orderIndex?: unknown;
        operationKey?: unknown;
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

      const operationKey = z.uuid().optional().safeParse(data.operationKey);
      if (!operationKey.success) {
        throw new Error(
          "Validation error. Invalid Knowledge Source request key",
        );
      }
      const learned = await this.knowledge.create(subjectId, {
        ...scope,
        slug: operationKey.data
          ? `profile-knowledge-${scope.profileId}-${operationKey.data}`
          : undefined,
        title,
        content,
        orderIndex: this.toOrderIndex(data.orderIndex),
      });

      return c.json({
        data: learned.source,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
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

import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { Service } from "../../../../../../../../../../../service";
import { Service as ProfileSources } from "../../../../../../../../../../../service/singlepage/social-module/profile/knowledge/sources";
import { toOrderIndex, readSourceDraft } from "./helpers";

export class Handler {
  service: Service;
  knowledge: ProfileSources;

  constructor(service: Service) {
    this.service = service;
    this.knowledge = new ProfileSources(service);
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const targetSocialModuleProfileId = c.req.param(
        "targetSocialModuleProfileId",
      );
      const actorId = c.req.param("id");

      if (!actorId || !targetSocialModuleProfileId) {
        throw new Error(
          "Validation error. The requesting subject and knowledge profile are required",
        );
      }

      const data = await readSourceDraft(c);
      const storeId = c.get("storeEmployeeTrainingStoreId");
      const title = data.title;
      const content = data.content.trim();

      if (!title) {
        throw new Error("Validation error. Knowledge Source title is required");
      }

      if (!content) {
        throw new Error(
          "Validation error. Knowledge Source content is required",
        );
      }

      const learned = await this.knowledge.create(actorId, {
        profileId: targetSocialModuleProfileId,
        storeId,
        slug: data.operationKey
          ? `profile-knowledge-${targetSocialModuleProfileId}-${data.operationKey}`
          : undefined,
        title,
        content,
        files: data.files,
        orderIndex: toOrderIndex(data.orderIndex),
      });

      return c.json({
        data: learned.source,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

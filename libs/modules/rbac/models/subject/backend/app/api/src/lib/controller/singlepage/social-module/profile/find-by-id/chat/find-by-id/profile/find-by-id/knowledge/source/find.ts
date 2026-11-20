import { getHttpErrorType } from "@sps/backend-utils";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../service";
import { findProfileKnowledgeSourceIds } from "./helpers";
import { parsePagination } from "../../skill/helpers";

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

      // Repair grants from versions that predate the scoped attachment routes.
      const ownerId = c.req.param("id")!;
      const ownership =
        await this.service.module.subjectsToSocialModuleProfiles.find({
          params: {
            filters: {
              and: [
                { column: "subjectId", method: "eq", value: ownerId },
                {
                  column: "socialModuleProfileId",
                  method: "eq",
                  value: targetSocialModuleProfileId,
                },
                { column: "variant", method: "eq", value: "assistant" },
              ],
            },
          },
        });
      if (ownership.length)
        await this.service.socialModuleProfileKnowledgeAccessEnsure({
          ownerRbacSubjectId: ownerId,
          socialModuleProfileId: targetSocialModuleProfileId,
        });

      const storeId = c.get("storeEmployeeTrainingStoreId");
      const page = parsePagination(c);
      const sourceIds = await findProfileKnowledgeSourceIds({
        service: this.service,
        targetSocialModuleProfileId,
        storeId,
        ...page,
      });
      const documents = await this.knowledgeService.listSources({
        sourceIds,
      });

      const offset = page.offset ?? 0;
      const data = storeId
        ? documents
            .filter(({ variant }) => variant === "default")
            .slice(offset, page.limit ? offset + page.limit : undefined)
        : documents;
      return c.json({ data });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

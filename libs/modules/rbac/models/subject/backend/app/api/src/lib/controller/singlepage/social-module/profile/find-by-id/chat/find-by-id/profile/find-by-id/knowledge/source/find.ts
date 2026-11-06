import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
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
      const ownership = await this.service.subjectsToSocialModuleProfiles.find({
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

      const sourceIds = await findProfileKnowledgeSourceIds({
        service: this.service,
        targetSocialModuleProfileId,
        ...parsePagination(c),
      });
      const documents = await this.knowledgeService.listSources({
        sourceIds,
      });

      return c.json({ data: documents });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

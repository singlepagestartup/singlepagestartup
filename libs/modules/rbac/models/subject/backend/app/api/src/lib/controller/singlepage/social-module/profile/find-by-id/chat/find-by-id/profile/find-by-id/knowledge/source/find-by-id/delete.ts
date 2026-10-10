import { api as profileSourcesApi } from "@sps/social/relations/profiles-to-knowledge-module-sources/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../../service";

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

      if (c.req.query("unlink") === "true") {
        const profileId = c.req.param("targetSocialModuleProfileId");
        const source = (
          await this.knowledgeService.listSources({
            sourceIds: [knowledgeModuleSourceId],
          })
        )[0];
        const relations =
          await this.service.socialModule.profilesToKnowledgeModuleSources.find(
            {
              params: {
                filters: {
                  and: [
                    { column: "profileId", method: "eq", value: profileId },
                    {
                      column: "knowledgeModuleSourceId",
                      method: "eq",
                      value: knowledgeModuleSourceId,
                    },
                  ],
                },
              },
            },
          );
        for (const relation of relations)
          await profileSourcesApi.delete({
            id: relation.id,
            options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY! } },
          });
        return c.json({ data: source });
      }
      const source = await this.knowledgeService.deleteSource(
        knowledgeModuleSourceId,
      );

      return c.json({ data: source });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

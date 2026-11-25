import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: unknown): Promise<Response> {
    try {
      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      const socialModuleProfile =
        await this.service.modules.social.profile.findById({
          id: socialModuleProfileId,
        });

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const rbacSubjectAuthenticationJwt = authorization(c);
      if (!rbacSubjectAuthenticationJwt) {
        throw new Error("Authentication error. Sign in to view MCP tools");
      }
      const sender = await this.service.me({
        token: rbacSubjectAuthenticationJwt,
      });
      if (
        !sender ||
        sender.variant !== "default" ||
        sender.id !== c.req.param("id")
      ) {
        throw new Error(
          "Forbidden error. The MCP catalog requires the caller's session",
        );
      }
      const catalogSession =
        await this.service.socialModuleProfileMcpCatalogOpen({
          subjectId: sender.id,
          configuredServerIds: Array.isArray(
            socialModuleProfile.allowedMcpServerIds,
          )
            ? socialModuleProfile.allowedMcpServerIds.filter(
                (identifier) => typeof identifier === "string",
              )
            : [],
          rbacSubjectAuthenticationJwt,
        });

      try {
        return c.json({ data: catalogSession.catalog });
      } finally {
        await catalogSession.close();
      }
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

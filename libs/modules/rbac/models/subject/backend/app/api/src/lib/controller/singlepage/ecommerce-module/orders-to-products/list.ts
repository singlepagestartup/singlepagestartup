import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const requestedProfileId =
        c.req.param("socialModuleProfileId") ??
        c.req.query("socialModuleProfileId");
      if (!requestedProfileId) {
        const profiles = await this.service.subjectsToSocialModuleProfiles.find(
          {
            params: {
              filters: {
                and: [{ column: "subjectId", method: "eq", value: id }],
              },
              limit: 1,
            },
          },
        );
        if (!profiles.length) {
          return c.json({ data: [] });
        }
      }

      /**
       * `RequestSubjectIdOwner` has matched the caller to `:id`. The service
       * keeps the lines to the orders linked to that subject, so the caller's
       * filters only narrow them (issue #349).
       */
      const ecommerceModuleOrdersToProducts = await withConsistencySnapshot(
        async () =>
          this.service.ecommerceOrdersToProductsList({
            id,
            socialModuleProfileId:
              c.req.param("socialModuleProfileId") ??
              c.req.query("socialModuleProfileId"),
            filters: c.get("parsedQuery")?.filters?.["and"],
          }),
      );

      return c.json({
        data: ecommerceModuleOrdersToProducts,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

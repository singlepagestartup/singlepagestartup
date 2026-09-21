import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import QueryString from "qs";
import { getHttpErrorType } from "@sps/backend-utils";
import { applyOutputSchema } from "@sps/shared-backend-api";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id");
      }

      const params = c.req.query();
      const parsedQuery = QueryString.parse(params);

      const subjectsToIdentities = await this.service.subjectsToIdentities.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: uuid,
                },
              ],
            },
          },
        },
      );

      if (!subjectsToIdentities) {
        throw new Error("Not Found error. No subjects to identities found");
      }

      const queryFilters = parsedQuery.filters?.["and"] || [];

      const identities = await this.service.identity.find({
        params: {
          filters: {
            and: [
              ...queryFilters,
              {
                column: "id",
                method: "inArray",
                value: subjectsToIdentities.map((item) => item.identityId),
              },
            ],
          },
        },
      });

      /**
       * This route answers with identity rows but builds its own response, so
       * the model's output schema has to be applied here (issue #270). The
       * framework sensitive-route list stops at the subject id, so this
       * sub-path is reachable without it.
       */
      return c.json({
        data: applyOutputSchema({
          c,
          service: this.service.identity,
          data: identities,
        }),
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

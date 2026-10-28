import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Service } from "../../../service";
import type { IAuthorFindParams } from "@sps/social/models/profile/sdk/model";
export class Handler {
  constructor(readonly service: Service) {}
  async execute(c: Context, mode: "find" | "count" | "detail") {
    try {
      const params: IAuthorFindParams = {};
      for (const [key, value] of Object.entries(c.req.query())) {
        if (
          ![
            ...(mode === "detail"
              ? []
              : [
                  "profileId",
                  "blogModuleArticleId",
                  "ecommerceModuleProductId",
                ]),
            ...(mode === "find" ? ["limit", "offset"] : []),
          ].includes(key)
        )
          throw new Error("Validation error. Unsupported author query");
        if (key === "limit" || key === "offset") {
          if (!/^\d+$/.test(value))
            throw new Error("Validation error. Invalid author pagination");
          params[key] = Number(value);
        } else params[key as "profileId"] = value;
      }
      const data = await withConsistencySnapshot(async () => {
        if (mode === "detail")
          return this.service.authorFindById({ id: c.req.param("id")! });
        if (mode === "count") return this.service.authorFindCount(params);
        return this.service.authorFind(params);
      });
      return c.req.method === "HEAD"
        ? c.newResponse(null, 200, { "Content-Type": "application/json" })
        : c.json({ data });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

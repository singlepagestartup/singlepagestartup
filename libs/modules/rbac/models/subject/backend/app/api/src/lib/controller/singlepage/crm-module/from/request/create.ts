import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { requestSubmissionSchema as crmRequestSubmissionSchema } from "@sps/crm/models/request/sdk/model";
import type { Service } from "../../../../../service";

export class Handler {
  constructor(readonly service: Service) {}
  async execute(c: Context, next: any): Promise<Response> {
    try {
      const subjectId = c.req.param("id");
      const crmModuleFormId = c.req.param("crmModuleFormId");
      if (!subjectId || !crmModuleFormId)
        throw new Error("Validation error. Subject and CRM Form are required");
      const body = await c.req.parseBody();
      if (typeof body.data !== "string")
        throw new Error("Validation error. Invalid CRM submission body");
      let raw: unknown;
      try {
        raw = JSON.parse(body.data);
      } catch {
        throw new Error("Validation error. Invalid CRM submission JSON");
      }
      const parsed = crmRequestSubmissionSchema.safeParse(raw);
      if (!parsed.success)
        throw new Error("Validation error. Invalid CRM submission values");
      const data = parsed.data;
      return c.json({
        data: await this.service.crmModuleFormRequestCreate({
          subjectId,
          crmModuleFormId,
          data,
        }),
      });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { RBAC_REVOKED_SUBJECT_CONTEXT_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { Service } from "../../../service";
import { deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { authorization, getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const { subject } = await this.service.logout({
        token: authorization(c),
      });

      if (subject) {
        c.set(RBAC_REVOKED_SUBJECT_CONTEXT_KEY, subject.id);
      }

      deleteCookie(c, "rbac.subject.jwt");

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

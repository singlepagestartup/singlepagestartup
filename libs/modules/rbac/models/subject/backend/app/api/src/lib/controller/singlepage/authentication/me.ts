import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 200,
          },
        );
      }

      const subject = await this.service.me({ token });

      if (!subject) {
        return c.json({ data: null });
      }

      const authenticatedSubject = await this.service.authenticationMe({
        subjectId: subject.id,
      });
      const data = authenticatedSubject ?? null;

      return c.json({
        data,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

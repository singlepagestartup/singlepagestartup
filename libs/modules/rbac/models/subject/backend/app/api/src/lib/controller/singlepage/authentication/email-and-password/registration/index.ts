import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../service";
import { authorization, getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return next();
      }

      const data = JSON.parse(body["data"]);
      const token = authorization(c);
      let subjectId: string | undefined;
      if (token) {
        const subject = await this.service.me({ token });
        if (!subject) {
          throw new Error("Authentication error. Subject not found");
        }
        subjectId = subject.id;
      }

      const entity = await this.service.authenticationLoginAndPassowrd({
        data,
        type: "registration",
        roles: data.roles || [],
        subjectId,
      });

      c.header("Cache-Control", "no-store");
      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

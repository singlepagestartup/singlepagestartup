import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { applyOutputSchema } from "@sps/shared-backend-api";
import { z } from "zod";
import type { Service as SubjectService } from "../../../service";
import { Service } from "../../../service/singlepage/authentication/email-and-password/change-email";

export class Handler {
  constructor(readonly service: SubjectService) {}
  async execute(
    c: Context,
    operation: "request" | "verify",
  ): Promise<Response> {
    try {
      const subjectId = c.req.param("id"),
        identityId = c.req.param("identityId");
      if (!subjectId || !identityId)
        throw new Error("Validation error. Subject and Identity are required");
      const body = await c.req.parseBody();
      if (typeof body.data !== "string")
        throw new Error("Validation error. Invalid body");
      const input = JSON.parse(body.data);
      const service = new Service(this.service);
      if (operation === "request") {
        const parsed = z
          .object({
            email: z.string().optional(),
            verificationId: z.string().uuid().optional(),
          })
          .strict()
          .safeParse(input);
        if (!parsed.success)
          throw new Error(
            "Validation error. Invalid email verification request",
          );
        return c.json({
          data: await service.request({
            subjectId,
            identityId,
            data: parsed.data,
          }),
        });
      }
      const parsed = z
        .object({
          challengeId: z.string().uuid(),
          code: z.string().regex(/^\d{6}$/),
        })
        .strict()
        .safeParse(input);
      if (!parsed.success)
        throw new Error(
          "Validation error. Enter the six-digit verification code",
        );
      const result = await service.verify({
        subjectId,
        identityId,
        data: parsed.data,
      });
      return c.json({
        data:
          result.stage === "complete"
            ? {
                ...result,
                identity: applyOutputSchema({
                  c,
                  service: this.service.identity,
                  data: result.identity,
                }),
              }
            : result,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

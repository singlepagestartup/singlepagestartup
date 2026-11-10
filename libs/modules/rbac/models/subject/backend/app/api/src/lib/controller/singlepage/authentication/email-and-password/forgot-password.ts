import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";

/**
 * The answer to every request, whether or not a reset code was stored
 * (issue #310), so the response does not tell whether an address has an
 * account.
 */
const ACCEPTED = {
  data: {
    ok: true,
  },
};

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

      if (typeof data.email !== "string" || !data.email.trim()) {
        return c.json(ACCEPTED, 201);
      }
      const email = data.email.trim().toLowerCase();
      const identities = await this.service.identity.find({
        params: {
          filters: {
            and: [
              {
                column: "email",
                method: "eq",
                value: email,
              },
              {
                column: "provider",
                method: "eq",
                value: "email_and_password",
              },
            ],
          },
        },
      });

      // A reset code is stored only for exactly one identity linked to a
      // subject; every other address gets the same answer.
      if (identities?.length !== 1) {
        return c.json(ACCEPTED, 201);
      }

      const subjectsToIdentities = await this.service.subjectsToIdentities.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "identityId",
                  method: "eq",
                  value: identities[0].id,
                },
              ],
            },
          },
        },
      );

      if (!subjectsToIdentities?.length) {
        return c.json(ACCEPTED, 201);
      }

      const code = await this.service.identity.issuePasswordResetCode({
        id: identities[0].id,
        email,
      });
      if (code) {
        // Mail-provider latency must not reveal whether the address has an account.
        void this.service.notificationModule.notification
          .sendPasswordReset({ email, code })
          .catch((error: unknown) => {
            const errorType =
              error instanceof Error ? error.name : "UnknownError";
            logger.error("Password reset email delivery failed", { errorType });
          });
      }

      return c.json(ACCEPTED, 201);
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

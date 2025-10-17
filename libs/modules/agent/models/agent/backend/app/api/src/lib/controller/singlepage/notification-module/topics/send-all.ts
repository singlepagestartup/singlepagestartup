import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as notificationModuleTopicApi } from "@sps/notification/models/topic/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      logger.info("Billing module payment intent check started");

      try {
        await notificationModuleTopicApi.sendAll({
          data: {},
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      } catch (error: any) {
        // logger.error("Billing module payment intent check failed", {
        //   error: error,
        // });
      }

      logger.info("Billing module payment intent check finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { logger } from "@sps/backend-utils";
import { api as broadcastModuleMessageApi } from "@sps/broadcast/models/message/sdk/server";

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

      logger.info("Broadcast module message delete expired started");

      try {
        const expiredMessages = await broadcastModuleMessageApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "expiresAt",
                  method: "lt",
                  value: new Date().toISOString(),
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

        if (expiredMessages?.length) {
          for (const message of expiredMessages) {
            await broadcastModuleMessageApi.delete({
              id: message.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }
      } catch (error: any) {
        // logger.error("Billing module payment intent check failed", {
        //   error: error,
        // });
      }

      logger.info("Broadcast module message delete expired finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}

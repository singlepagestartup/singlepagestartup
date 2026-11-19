import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import type { FindServiceProps } from "@sps/shared-backend-api";

export const ECOMMERCE_ORDER_CHECK_BATCH_LIMIT = 100;

export const ECOMMERCE_ORDER_CHECK_STATUSES = [
  "paying",
  "delivering",
  "requested_cancelation",
];

export class Handler {
  service: Service;
  private static readonly recoveryCursors = new WeakMap<Service, string>();

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      logger.info("Ecommerce module order check started");

      const orderService = this.service.modules.ecommerce.order;
      const currentOrders = await orderService.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "inArray",
                value: ECOMMERCE_ORDER_CHECK_STATUSES,
              },
            ],
          },
          limit: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
          orderBy: {
            and: [
              {
                column: "updatedAt",
                method: "asc",
              },
            ],
          },
        },
      });

      // A separate rotating queue keeps terminal payment failures discoverable
      // without delaying the current paying/subscription batch.
      const recoveryRead = (after?: string) => {
        const filters: NonNullable<
          NonNullable<FindServiceProps["params"]>["filters"]
        > = {
          and: [
            { column: "type", method: "eq", value: "history" },
            {
              column: "status",
              method: "inArray",
              value: ["canceling", "canceled"],
            },
            {
              column: "paymentFailureCanceledAt",
              method: "isNotNull",
              value: null,
            },
          ],
        };
        if (after) {
          filters.and.push({ column: "id", method: "gt", value: after });
        }
        return orderService.find({
          params: {
            filters,
            limit: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
            orderBy: { and: [{ column: "id", method: "asc" }] },
          },
        });
      };
      const cursor = Handler.recoveryCursors.get(this.service);
      let recoveryOrders = await recoveryRead(cursor);
      if (!recoveryOrders?.length && cursor) {
        recoveryOrders = await recoveryRead();
      }
      const lastRecoveryOrder = recoveryOrders?.at(-1);
      if (lastRecoveryOrder) {
        Handler.recoveryCursors.set(this.service, lastRecoveryOrder.id);
      }
      const orders = [
        ...new Map(
          [...(currentOrders ?? []), ...(recoveryOrders ?? [])].map((order) => [
            order.id,
            order,
          ]),
        ).values(),
      ];

      if (orders.length) {
        for (const order of orders) {
          try {
            await ecommerceModuleOrderApi.check({
              id: order.id,
              data: {},
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          } catch (error: any) {
            // logger.error("Ecommerce module order check failed", {
            //   error: error,
            // });
          }
        }
      }

      logger.info("Ecommerce module order check finished");

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

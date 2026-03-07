import { FindServiceProps } from "@sps/shared-backend-api";
import { api as orderApi } from "@sps/ecommerce/models/order/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export type IExecuteProps = {};

type IConstructorProps = {
  find: (props?: FindServiceProps) => Promise<any[]>;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;
};

export class Service {
  find: IConstructorProps["find"];
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;

  constructor(props: IConstructorProps) {
    this.find = props.find;
    this.ordersToBillingModulePaymentIntents =
      props.ordersToBillingModulePaymentIntents;
  }

  async execute(_props: IExecuteProps) {
    try {
      void _props;

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
      }

      const oldOrders = await this.find({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
              },
              {
                column: "status",
                method: "eq",
                value: "canceled",
              },
            ],
          },
        },
      });

      if (oldOrders?.length) {
        for (const oldOrder of oldOrders) {
          const orderToBillingPaymentIntents =
            await this.ordersToBillingModulePaymentIntents.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "orderId",
                      method: "eq",
                      value: oldOrder.id,
                    },
                  ],
                },
              },
            });

          if (orderToBillingPaymentIntents?.length) {
            continue;
          }

          await orderApi.delete({
            id: oldOrder.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
      }
    } catch (error) {
      logger.error("clearOldOrders", error);
    }
  }
}

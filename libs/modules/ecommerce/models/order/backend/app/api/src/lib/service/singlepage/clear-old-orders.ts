import { FindServiceProps } from "@sps/shared-backend-api";
import { api as orderApi } from "@sps/ecommerce/models/order/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";

export type IExecuteProps = {};

type IFindOldOrders = (
  props: FindServiceProps,
) => Promise<IEcommerceModuleOrder[] | undefined>;

type IFindOrdersToBillingModulePaymentIntents = (
  props: FindServiceProps,
) =>
  | Promise<IEcommerceModuleOrdersToBillingModulePaymentIntents[] | undefined>
  | Promise<IEcommerceModuleOrdersToBillingModulePaymentIntents[]>;

export interface IConstructorProps {
  findOldOrders: IFindOldOrders;
  findOrdersToBillingModulePaymentIntents: IFindOrdersToBillingModulePaymentIntents;
}

export class Service {
  findOldOrders: IFindOldOrders;
  findOrdersToBillingModulePaymentIntents: IFindOrdersToBillingModulePaymentIntents;

  constructor(props: IConstructorProps) {
    this.findOldOrders = props.findOldOrders;
    this.findOrdersToBillingModulePaymentIntents =
      props.findOrdersToBillingModulePaymentIntents;
  }

  async execute(_props: IExecuteProps) {
    try {
      void _props;

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
      }

      const oldOrders = await this.findOldOrders({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: new Date(Date.now() - 1000 * 60 * 60 * 24),
              },
            ],
          },
        },
      });

      if (oldOrders?.length) {
        for (const oldOrder of oldOrders) {
          const orderToBillingPaymentIntents =
            await this.findOrdersToBillingModulePaymentIntents({
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

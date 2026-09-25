import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../../service";
import { type IResult } from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { type IUnpricedOrderToProduct } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const orderId = c.req.param("orderId");

      if (!orderId) {
        throw new Error("Validation error. No orderId provided");
      }

      // Ownership is checked before the order is read: a missing order and
      // another subject's order are refused alike, so the answer does not
      // reveal which order ids exist.
      await this.service.ecommerceModuleAssertSubjectOwnsOrder({
        subjectId: id,
        ecommerceModuleOrderId: orderId,
      });

      const ecommerceModuleOrder =
        await this.service.ecommerceModule.order.findById({
          id: orderId,
        });

      if (!ecommerceModuleOrder) {
        throw new Error("Not Found error. No order found");
      }

      const ecommerceModuleOrderTotals =
        await this.service.ecommerceModule.order.findByIdTotal({
          id: orderId,
        });

      const totalsMap = new Map<
        string,
        {
          billingModuleCurrency: IBillingModuleCurrency;
          total: number;
          orders: (IEcommerceModuleOrder & {
            total: IResult["ITotalResult"];
          })[];
        }
      >();

      const unpriced: IUnpricedOrderToProduct[] = [
        ...ecommerceModuleOrderTotals.unpriced,
      ];

      for (const ecommerceModuleOrderTotal of ecommerceModuleOrderTotals.totals) {
        const currencyId = ecommerceModuleOrderTotal.billingModuleCurrency.id;
        const entry = totalsMap.get(currencyId);

        if (entry) {
          entry.total += ecommerceModuleOrderTotal.total;
        } else {
          totalsMap.set(currencyId, {
            billingModuleCurrency:
              ecommerceModuleOrderTotal.billingModuleCurrency,
            total: ecommerceModuleOrderTotal.total,
            orders: [
              {
                ...ecommerceModuleOrder,
                total: ecommerceModuleOrderTotals.totals,
              },
            ],
          });
        }
      }

      return c.json({
        data: Array.from(totalsMap.values()),
        unpriced,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

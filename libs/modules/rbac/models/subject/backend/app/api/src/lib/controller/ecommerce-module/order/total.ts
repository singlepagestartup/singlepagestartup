import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/backend-utils";
import { Service } from "../../../service";
import {
  api as ecommerceModuleOrderApi,
  type IResult,
} from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new HTTPException(400, {
          message: "RBAC_JWT_SECRET not set",
        });
      }

      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "No id provided",
        });
      }

      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 401,
          },
        );
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new HTTPException(403, {
          message: "Only order owner can update order",
        });
      }

      const subjectsToEcommerceModuleOrders =
        await subjectsToEcommerceModuleOrdersApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: id,
                },
              ],
            },
          },
        });

      if (!subjectsToEcommerceModuleOrders?.length) {
        return c.json({
          data: [],
        });
      }

      const ecommerceModuleOrdersWithCartType =
        await ecommerceModuleOrderApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: subjectsToEcommerceModuleOrders.map(
                    (subjectToEcommerceModuleOrder) =>
                      subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
                  ),
                },
                {
                  column: "type",
                  method: "eq",
                  value: "cart",
                },
              ],
            },
          },
        });

      if (!ecommerceModuleOrdersWithCartType?.length) {
        return c.json({
          data: [],
        });
      }

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

      for (const ecommerceModuleOrder of ecommerceModuleOrdersWithCartType) {
        const ecommerceModuleOrderTotals = await ecommerceModuleOrderApi.total({
          id: ecommerceModuleOrder.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

        for (const ecommerceModuleOrderTotal of ecommerceModuleOrderTotals) {
          const currencyId = ecommerceModuleOrderTotal.billingModuleCurrency.id;
          if (totalsMap.has(currencyId)) {
            const entry = totalsMap.get(currencyId)!;
            entry.total += ecommerceModuleOrderTotal.total;

            if (!entry.orders.some((o) => o.id === ecommerceModuleOrder.id)) {
              entry.orders.push({
                ...ecommerceModuleOrder,
                total: ecommerceModuleOrderTotals,
              });
            }
          } else {
            totalsMap.set(currencyId, {
              billingModuleCurrency:
                ecommerceModuleOrderTotal.billingModuleCurrency,
              total: ecommerceModuleOrderTotal.total,
              orders: [
                {
                  ...ecommerceModuleOrder,
                  total: ecommerceModuleOrderTotals,
                },
              ],
            });
          }
        }
      }

      return c.json({
        data: Array.from(totalsMap.values()),
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}

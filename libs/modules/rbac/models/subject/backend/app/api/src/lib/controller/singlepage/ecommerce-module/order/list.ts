import { STORE_TEST_ORDER_VARIANT } from "@sps/ecommerce/models/order/sdk/model";
import {
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  UUID_VALUE_REGEX,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { authorization, getHttpErrorType, verifyJwt } from "@sps/backend-utils";
import { Service } from "../../../../service";
import {
  withConsistencySnapshot,
  type IQueryBuilderFilter,
} from "@sps/shared-backend-api";
import type { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { ISubjectCartDetails } from "@sps/rbac/models/subject/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await verifyJwt(token, RBAC_JWT_SECRET, {
        type: "access",
      });

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can read orders");
      }

      return await withConsistencySnapshot(async () => {
        const params = c.get("parsedQuery");
        const includeCartDetails = c.req.query("includeCartDetails") === "true";
        const includePurchaseDetails =
          c.req.query("includePurchaseDetails") === "true";
        const includeCustomerDetails =
          c.req.query("includeCustomerDetails") === "true";
        if (includeCustomerDetails && includeCartDetails) {
          throw new Error(
            "Validation error. Customer history and cart details require separate queries",
          );
        }
        let requestedOrderId: string | undefined;
        if (includeCustomerDetails && Array.isArray(params?.filters?.and)) {
          const exact = params.filters.and.find(
            (item: IQueryBuilderFilter) =>
              item?.column === "id" &&
              item.method === "eq" &&
              typeof item.value === "string",
          );
          requestedOrderId = exact?.value;
          if (
            requestedOrderId !== undefined &&
            !UUID_VALUE_REGEX.test(requestedOrderId)
          ) {
            return c.json({ data: [] });
          }
        }
        const subjectsToEcommerceModuleOrders =
          await this.service.module.subjectsToEcommerceModuleOrders.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: id,
                  },
                  ...(requestedOrderId
                    ? [
                        {
                          column: "ecommerceModuleOrderId",
                          method: "eq" as const,
                          value: requestedOrderId,
                        },
                      ]
                    : []),
                ],
              },
            },
          });

        const ownedOrderIds = (subjectsToEcommerceModuleOrders ?? [])
          .filter(
            (relation) => !includeCustomerDetails || relation.subjectId === id,
          )
          .map((relation) => relation.ecommerceModuleOrderId);
        if (!ownedOrderIds.length) {
          return c.json({ data: [] });
        }

        let scopeFilters: IQueryBuilderFilter[] = [];
        if (includeCustomerDetails) {
          scopeFilters = [
            { column: "type", method: "eq", value: "history" },
            {
              column: "variant",
              method: "ne",
              value: STORE_TEST_ORDER_VARIANT,
            },
          ];
        } else if (includeCartDetails || !params?.filters) {
          scopeFilters = [
            { column: "type", method: "eq", value: "cart" },
            { column: "status", method: "eq", value: "new" },
          ];
        }
        const orders = await this.service.modules.ecommerce.order.find({
          params: {
            ...params,
            filters: {
              ...params?.filters,
              and: [
                { column: "id", method: "inArray", value: ownedOrderIds },
                ...scopeFilters,
                ...(params?.filters?.and ?? []),
              ],
            },
          },
        });

        // An OR filter must never widen the result beyond the subject's orders.
        const ownedIds = new Set(ownedOrderIds);
        const ownedOrders = (orders ?? []).filter(
          (order) =>
            ownedIds.has(order.id) &&
            order.variant !== STORE_TEST_ORDER_VARIANT &&
            (!includeCustomerDetails || order.type === "history") &&
            (!requestedOrderId || order.id === requestedOrderId),
        );
        if (includeCartDetails) {
          const carts: (IEcommerceModuleOrder & {
            cartDetails: ISubjectCartDetails;
          })[] = [];
          for (const order of ownedOrders) {
            // Defense against OR filters: private cart expansion never includes historical orders.
            if (order.type !== "cart" || order.status !== "new") {
              continue;
            }
            const cartDetails =
              await this.service.ecommerceModuleOrderCartDetails({
                subjectId: id,
                orderId: order.id,
              });
            carts.push({
              ...order,
              cartDetails,
            });
          }
          return c.json({ data: carts });
        }
        let result: IEcommerceModuleOrder[] = ownedOrders;
        if (includePurchaseDetails) {
          result = await this.service.ecommerceModuleOrderPurchaseDetails({
            subjectId: id,
            orders: ownedOrders,
          });
        }
        if (includeCustomerDetails) {
          const details =
            await this.service.ecommerceModuleOrderCustomerDetails({
              subjectId: id,
              ownedHistoryOrderIds: result.map((order) => order.id),
              requestedOrderId,
            });
          return c.json({
            data: result.map((order) => ({
              ...order,
              customerDetails: details.get(order.id),
            })),
          });
        }
        return c.json({ data: result });
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import type {
  IModel as IEcommerceModuleOrder,
  IPurchaseDetails,
} from "@sps/ecommerce/models/order/sdk/model";

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

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can read orders");
      }

      return await withConsistencySnapshot(async () => {
        const subjectsToEcommerceModuleOrders =
          await this.service.subjectsToEcommerceModuleOrders.find({
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

        const params = c.get("parsedQuery");
        const includePurchaseDetails =
          c.req.query("includePurchaseDetails") === "true";
        const ownedOrderIds = subjectsToEcommerceModuleOrders.map(
          (relation) => relation.ecommerceModuleOrderId,
        );
        const defaultFilters = [
          { column: "type", method: "eq", value: "cart" },
          { column: "status", method: "eq", value: "new" },
        ];
        const orders = await this.service.ecommerceModule.order.find({
          params: {
            ...params,
            filters: {
              ...params?.filters,
              and: [
                { column: "id", method: "inArray", value: ownedOrderIds },
                ...(params?.filters
                  ? (params.filters.and ?? [])
                  : defaultFilters),
              ],
            },
          },
        });

        // An OR filter must never widen the result beyond the subject's orders.
        const ownedIds = new Set(ownedOrderIds);
        const ownedOrders = (orders ?? []).filter((order) =>
          ownedIds.has(order.id),
        );
        if (!includePurchaseDetails) return c.json({ data: ownedOrders });
        const purchases: (IEcommerceModuleOrder & {
          purchaseDetails: IPurchaseDetails;
        })[] = [];
        for (const order of ownedOrders) {
          const totals = await this.service.ecommerceModule.order.findByIdTotal(
            { id: order.id },
          );
          const links =
            await this.service.ecommerceModule.ordersToFileStorageModuleFiles.find(
              {
                params: {
                  filters: {
                    and: [
                      { column: "orderId", method: "eq", value: order.id },
                      {
                        column: "variant",
                        method: "eq",
                        value: "receipt-default",
                      },
                    ],
                  },
                },
              },
            );
          const receiptIds = (links || []).map(
            (link) => link.fileStorageModuleFileId,
          );
          const files = receiptIds.length
            ? await this.service.fileStorageModule.file.find({
                params: {
                  filters: {
                    and: [
                      { column: "id", method: "inArray", value: receiptIds },
                    ],
                  },
                },
              })
            : [];
          const receipts = receiptIds.flatMap((id) => {
            const file = files?.find((file) => file.id === id);
            return file ? [file] : [];
          });
          purchases.push({ ...order, purchaseDetails: { totals, receipts } });
        }
        return c.json({ data: purchases });
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { api as attributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";

export type IExecuteProps = {
  id: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined");
    }

    const priceAttributeKeys = await attributeKeyApi.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "price",
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
        next: {
          cache: "no-store",
        },
      },
    });

    if (!priceAttributeKeys?.length) {
      throw new Error("Price attribute key not found");
    }

    const orderToProducts = await ordersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: props.id,
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

    if (!orderToProducts?.length) {
      throw new Error("Order does not have any products");
    }

    const result: {
      total: number;
      billingModuleCurrency: IBillingModuleCurrency;
    }[] = [];

    for (const orderToProduct of orderToProducts) {
      const orderToProductTotals = await ordersToProductsApi.total({
        id: orderToProduct.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!orderToProductTotals) {
        throw new Error("Order to product total not found");
      }

      orderToProductTotals.forEach((orderToProductTotal) => {
        result.push(orderToProductTotal);
      });
    }

    return result;
  }
}

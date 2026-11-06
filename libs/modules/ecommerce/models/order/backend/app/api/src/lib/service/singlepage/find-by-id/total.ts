import { inject, injectable } from "inversify";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { type IUnpricedOrderToProduct } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { OrderDI } from "../../../di";

export type IExecuteProps = {
  id: string;
};

export type IExecuteResult = {
  availableCurrencyIds: string[];
  totals: {
    total: number;
    billingModuleCurrency: IBillingModuleCurrency;
  }[];
  unpriced: IUnpricedOrderToProduct[];
};

@injectable()
export class Service {
  attributeKey: AttributeKeyService;
  ordersToProducts: OrdersToProductsService;

  constructor(
    @inject(OrderDI.IAttributeKeysService) attributeKey: AttributeKeyService,
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
  ) {
    this.attributeKey = attributeKey;
    this.ordersToProducts = ordersToProducts;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const priceAttributeKeys = await this.attributeKey.find({
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
    });

    if (!priceAttributeKeys?.length) {
      throw new Error("Not Found error. Price attribute key not found");
    }

    const orderToProducts = await this.ordersToProducts.find({
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
    });

    if (!orderToProducts?.length) {
      throw new Error("Not Found error. Order does not have any products");
    }

    const totals: IExecuteResult["totals"] = [];
    const unpriced: IExecuteResult["unpriced"] = [];
    let availableCurrencyIds: Set<string> | undefined;

    for (const orderToProduct of orderToProducts) {
      const orderToProductTotals = await this.ordersToProducts.getTotal({
        id: orderToProduct.id,
      });

      if (!orderToProductTotals) {
        throw new Error("Not Found error. Order to product total not found");
      }

      totals.push(...orderToProductTotals.totals);
      unpriced.push(...orderToProductTotals.unpriced);
      const lineCurrencies = new Set<string>(
        orderToProductTotals.totals.map(
          (total) => total.billingModuleCurrency.id,
        ),
      );
      availableCurrencyIds = availableCurrencyIds
        ? new Set(
            [...availableCurrencyIds].filter((id) => lineCurrencies.has(id)),
          )
        : lineCurrencies;
    }

    return {
      totals,
      unpriced,
      availableCurrencyIds: [...(availableCurrencyIds ?? [])],
    };
  }
}

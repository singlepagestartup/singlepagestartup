import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS } from "@sps/shared-utils";
import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import type { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import type { Service as TotalService } from "./total";
import type { Service as OrdersToCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";

export interface IConstructorProps {
  ordersToProducts: Pick<OrdersToProductsService, "find">;
  product: Pick<ProductService, "find">;
  total: (props: { id: string }) => ReturnType<TotalService["execute"]>;
  ordersToCurrencies: Pick<OrdersToCurrenciesService, "find">;
}
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}
  async execute(props: { id: string }): Promise<ICartDetails> {
    const lines = await this.dependencies.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.id }],
        },
      },
    });
    const maxLineQuantity = ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS.max;
    if (!lines?.length) {
      return { lines: [], totals: [], maxLineQuantity };
    }
    const products = await this.dependencies.product.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: [...new Set(lines.map((line) => line.productId))],
            },
          ],
        },
      },
    });
    const byId = new Map(products?.map((product) => [product.id, product]));
    const result = await this.dependencies.total(props);
    const currencyLinks = await this.dependencies.ordersToCurrencies.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.id }],
        },
      },
    });
    const selectedIds = [
      ...new Set(currencyLinks?.map((link) => link.billingModuleCurrencyId)),
    ];
    return {
      maxLineQuantity,
      availableCurrencyIds: result.availableCurrencyIds,
      ...(selectedIds.length === 1
        ? { billingModuleCurrencyId: selectedIds[0] }
        : {}),
      ...(result.unpriced.length ? { unpriced: result.unpriced } : {}),
      lines: lines.map((line) => ({
        ...line,
        product: byId.get(line.productId) ?? null,
      })),
      totals: result.totals,
    };
  }
}

import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import type { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import type { Service as TotalService } from "./total";

export interface IConstructorProps {
  ordersToProducts: Pick<OrdersToProductsService, "find">;
  product: Pick<ProductService, "find">;
  total: (props: { id: string }) => ReturnType<TotalService["execute"]>;
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
    if (!lines?.length) return { lines: [], totals: [] };
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
    return {
      ...(result.unpriced.length ? { unpriced: result.unpriced } : {}),
      lines: lines.map((line) => ({
        ...line,
        product: byId.get(line.productId) ?? null,
      })),
      totals: result.totals,
    };
  }
}

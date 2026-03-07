import { inject, injectable } from "inversify";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { OrderDI } from "../../../di";

export type IExecuteProps = {
  id: string;
};

@injectable()
export class Service {
  ordersToProducts: OrdersToProductsService;

  constructor(
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
  ) {
    this.ordersToProducts = ordersToProducts;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
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

    let result = orderToProducts.reduce((acc, orderToProduct) => {
      return acc + orderToProduct.quantity;
    }, 0);

    return result;
  }
}

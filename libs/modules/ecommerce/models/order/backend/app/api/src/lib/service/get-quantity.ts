import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
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

    let result = orderToProducts.reduce((acc, orderToProduct) => {
      return acc + orderToProduct.quantity;
    }, 0);

    return result;
  }
}

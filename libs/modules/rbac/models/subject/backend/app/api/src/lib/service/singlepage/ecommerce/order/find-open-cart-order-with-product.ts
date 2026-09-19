import { type IEcommerceModule } from "../../../../di";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export type IExecuteProps = {
  subjectId: string;
  productId: string;
};

type IConstructorProps = {
  ecommerceModule: IEcommerceModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
};

/**
 * Finds the subject's open cart order that already holds a product.
 *
 * An open cart is `type: "cart"` with `status: "new"`, the same key every cart
 * read uses, so the guard refuses exactly what the badge, the total and the
 * order list would have shown twice. Checkout moves an order to
 * `type: "history"`, which is what lets the same product be bought again.
 *
 * The narrowing runs subject-first. Asking `orders-to-products` for a product
 * before knowing which orders matter would scan every cart in the system that
 * holds it.
 */
export class Service {
  ecommerceModule: IEcommerceModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.ecommerceModule = props.ecommerceModule;
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  async execute(props: IExecuteProps): Promise<string | null> {
    const openCartOrderIds = await this.findOpenCartOrderIds({
      subjectId: props.subjectId,
    });

    if (!openCartOrderIds.length) {
      return null;
    }

    const ordersToProducts = await this.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: openCartOrderIds,
            },
            {
              column: "productId",
              method: "eq",
              value: props.productId,
            },
          ],
        },
      },
    });

    return ordersToProducts?.[0]?.orderId || null;
  }

  private async findOpenCartOrderIds(props: {
    subjectId: string;
  }): Promise<string[]> {
    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectId,
              },
            ],
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return [];
    }

    const orders = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToEcommerceModuleOrders.map(
                (subjectToEcommerceModuleOrder: {
                  ecommerceModuleOrderId: string;
                }) => subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
              ),
            },
            {
              column: "type",
              method: "eq",
              value: "cart",
            },
            {
              column: "status",
              method: "eq",
              value: "new",
            },
          ],
        },
      },
    });

    if (!orders?.length) {
      return [];
    }

    return orders.map((order: { id: string }) => order.id);
  }
}

import { type IEcommerceModule } from "../../../../di";
import type { Service as ProfilesToEcommerceModuleOrdersService } from "@sps/social/relations/profiles-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export interface IExecuteProps {
  socialModuleProfileId: string;
  productId: string;
}

interface IConstructorProps {
  ecommerceModule: IEcommerceModule;
  profilesToEcommerceModuleOrders: Pick<
    ProfilesToEcommerceModuleOrdersService,
    "find"
  >;
}

/**
 * Finds the profile's open cart order that already holds a product.
 *
 * An open cart is `type: "cart"` with `status: "new"`, the same key every cart
 * read uses, so the guard refuses exactly what the badge, the total and the
 * order list would have shown twice. Checkout moves an order to
 * `type: "history"`, which is what lets the same product be bought again.
 *
 * The narrowing runs profile-first. Asking `orders-to-products` for a product
 * before knowing which orders matter would scan every cart in the system that
 * holds it.
 */
export class Service {
  ecommerceModule: IEcommerceModule;
  profilesToEcommerceModuleOrders: Pick<
    ProfilesToEcommerceModuleOrdersService,
    "find"
  >;

  constructor(props: IConstructorProps) {
    this.ecommerceModule = props.ecommerceModule;
    this.profilesToEcommerceModuleOrders =
      props.profilesToEcommerceModuleOrders;
  }

  async execute(props: IExecuteProps): Promise<string | null> {
    const openCartOrderIds = await this.findOpenCartOrderIds({
      socialModuleProfileId: props.socialModuleProfileId,
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
    socialModuleProfileId: string;
  }): Promise<string[]> {
    const profilesToEcommerceModuleOrders =
      await this.profilesToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
            ],
          },
        },
      });

    if (!profilesToEcommerceModuleOrders?.length) {
      return [];
    }

    const orders = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: profilesToEcommerceModuleOrders.map(
                (profileToEcommerceModuleOrder: {
                  ecommerceModuleOrderId: string;
                }) => profileToEcommerceModuleOrder.ecommerceModuleOrderId,
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

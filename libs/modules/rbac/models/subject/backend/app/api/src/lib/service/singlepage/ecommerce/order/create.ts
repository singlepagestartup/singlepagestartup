import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  socialModuleProfileId?: string;
  productId: string;
  storeId: string;
  quantity: number;
  billingModuleCurrencyId?: string;
}

interface IConstructorProps {
  repository: Pick<Repository, "withProfileLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "ecommerceModuleResolveProfile"
    | "ecommerceModuleFindOpenCartOrderWithProduct"
    | "ecommerceModuleResolveOrderCurrency"
  > & {
    socialModule: Pick<
      SubjectService["socialModule"],
      "profilesToEcommerceModuleOrders"
    >;
  };
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { repository, service } = this.dependencies;
    const socialModuleProfileId = await service.ecommerceModuleResolveProfile({
      ...props,
      createIfMissing: true,
    });
    await repository.withProfileLock(
      { profileId: socialModuleProfileId },
      async () => {
        const existingOrderId =
          await service.ecommerceModuleFindOpenCartOrderWithProduct({
            socialModuleProfileId,
            productId: props.productId,
          });
        if (existingOrderId) {
          throw new Error("Conflict error. Product is already in the cart");
        }
        const billingModuleCurrencyId =
          await service.ecommerceModuleResolveOrderCurrency({
            productId: props.productId,
            billingModuleCurrencyId: props.billingModuleCurrencyId,
          });
        const order = await service.ecommerceModule.order.create({ data: {} });
        if (!order) throw new Error("Not Found error. No order found");
        await service.socialModule.profilesToEcommerceModuleOrders.create({
          data: {
            profileId: socialModuleProfileId,
            ecommerceModuleOrderId: order.id,
          },
        });
        const line = await service.ecommerceModule.ordersToProducts.create({
          data: {
            orderId: order.id,
            productId: props.productId,
            quantity: props.quantity,
          },
        });
        if (!line)
          throw new Error("Not Found error. No orders to products found");
        const store = await service.ecommerceModule.storesToOrders.create({
          data: { storeId: props.storeId, orderId: order.id },
        });
        if (!store)
          throw new Error("Not Found error. No stores to orders found");
        const currency =
          await service.ecommerceModule.ordersToBillingModuleCurrencies.create({
            data: { orderId: order.id, billingModuleCurrencyId },
          });
        if (!currency) {
          throw new Error(
            "Not Found error. No orders to billing module currencies found",
          );
        }
      },
    );
  }
}

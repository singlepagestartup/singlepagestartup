import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  productId: string;
  storeId: string;
  quantity: number;
  billingModuleCurrencyId?: string;
}

interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "subjectsToEcommerceModuleOrders"
    | "ecommerceModuleFindOpenCartOrderWithProduct"
    | "ecommerceModuleResolveOrderCurrency"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { repository, service } = this.dependencies;
    await repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        const existingOrderId =
          await service.ecommerceModuleFindOpenCartOrderWithProduct({
            subjectId: props.subjectId,
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
        await service.subjectsToEcommerceModuleOrders.create({
          data: {
            subjectId: props.subjectId,
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

import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
} from "@sps/shared-utils";
import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  lines?: { id: string; quantity: number }[];
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "subjectsToEcommerceModuleOrders"
    | "ecommerceModuleOrderAssertAccess"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { repository, service } = this.dependencies;
    await repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.ecommerceModuleOrderAssertAccess({
          subjectId: props.subjectId,
          orderId: props.orderId,
          ...(props.lines
            ? { lineIds: props.lines.map((line) => line.id) }
            : {}),
        });
        await service.ecommerceModule.order.lockForLifecycle({
          id: props.orderId,
        });
        const owners = await service.subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "eq",
                  value: props.orderId,
                },
              ],
            },
          },
        });
        if (
          !owners.length ||
          owners.some((owner) => owner.subjectId !== props.subjectId)
        ) {
          throw new Error(
            "Permission error. Order must belong only to the current subject",
          );
        }
        const order = await service.ecommerceModule.order.findById({
          id: props.orderId,
        });
        if (!order || order.type !== "cart" || order.status !== "new") {
          throw new Error(
            "Conflict error. Only an active cart order can be changed",
          );
        }
        const paymentLinks =
          await service.ecommerceModule.ordersToBillingModulePaymentIntents.find(
            {
              params: {
                filters: {
                  and: [
                    { column: "orderId", method: "eq", value: props.orderId },
                  ],
                },
              },
            },
          );
        if (paymentLinks.length) {
          throw new Error(
            "Conflict error. Cart has a payment attempt and cannot be changed",
          );
        }
        if (!props.lines) {
          await service.ecommerceModule.order.delete({ id: props.orderId });
          return;
        }
        if (
          !props.lines.length ||
          props.lines.some(
            (line) =>
              !Number.isSafeInteger(line.quantity) ||
              line.quantity < quantityBounds.min ||
              line.quantity > quantityBounds.max,
          )
        ) {
          throw new Error(
            `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
          );
        }
        const lines = await service.ecommerceModule.ordersToProducts.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
          },
        });
        for (const line of lines) {
          const product = await service.ecommerceModule.product.findById({
            id: line.productId,
          });
          if (product?.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG) {
            throw new Error(
              "Permission error. Initial Free cannot be changed through a cart",
            );
          }
        }
        for (const line of props.lines) {
          await service.ecommerceModule.ordersToProducts.update({
            id: line.id,
            data: { quantity: line.quantity },
          });
        }
      },
    );
  }
}

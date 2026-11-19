import { Service as InitialGrantProducts } from "../../billing/initial-grant-products";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import type { Repository } from "../../../../repository";
import type { SubjectServiceDependencies } from "../../index";
import { Service as SelectionService } from "./selection";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  lines?: { id: string; quantity: number }[];
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: SubjectServiceDependencies<"ecommerceModuleOrderAssertAccess">;
  closeRemovedWork?: (props: {
    customerId: string;
    orderId: string;
  }) => Promise<void>;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { repository, service } = this.dependencies;
    if (props.lines) {
      await service.ecommerceModuleOrderAssertAccess({
        subjectId: props.subjectId,
        orderId: props.orderId,
        lineIds: props.lines.map((line) => line.id),
      });
      const lines = await service.modules.ecommerce.ordersToProducts.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.orderId }],
          },
        },
      });
      const primary =
        lines?.filter(
          (line: { parentLineId?: string | null }) => !line.parentLineId,
        ) ?? [];
      if (primary.length === 1 && primary[0].offerId) {
        const currencies =
          await service.modules.ecommerce.ordersToBillingModuleCurrencies.find({
            params: {
              filters: {
                and: [
                  { column: "orderId", method: "eq", value: props.orderId },
                ],
              },
            },
          });
        if (currencies?.length !== 1) {
          throw new Error(
            "Validation error. Choose an order currency before updating quantity",
          );
        }
        const updates = new Map(
          props.lines.map((line) => [line.id, line.quantity]),
        );
        const selection = {
          offerId: primary[0].offerId,
          quantity: updates.get(primary[0].id) ?? primary[0].quantity,
          currencyId: currencies[0].billingModuleCurrencyId,
          destination: primary[0].destination,
          services: lines
            .filter(
              (line: { parentLineId?: string | null }) =>
                line.parentLineId === primary[0].id,
            )
            .map((line) => ({
              offerId: line.offerId!,
              quantity: updates.get(line.id) ?? line.quantity,
            })),
        };
        const operation = new SelectionService(this.dependencies);
        const preview = await operation.execute({
          subjectId: props.subjectId,
          orderId: props.orderId,
          data: {
            action: "preview",
            lineId: primary[0].id,
            selections: [selection],
          },
        });
        await operation.execute({
          subjectId: props.subjectId,
          orderId: props.orderId,
          data: {
            action: "apply",
            lineId: primary[0].id,
            selections: [selection],
            expectedVersions: preview.quotes.map((quote) => quote.version),
            expectedSelectionUpdatedAt: new Date(
              primary[0].selectionUpdatedAt,
            ).toISOString(),
          },
        });
        return;
      }
    }
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
        await service.modules.ecommerce.order.lockForLifecycle({
          id: props.orderId,
        });
        const owners =
          await service.module.subjectsToEcommerceModuleOrders.find({
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
        const order = await service.modules.ecommerce.order.findById({
          id: props.orderId,
        });
        if (!order || order.type !== "cart" || order.status !== "new") {
          throw new Error(
            "Conflict error. Only an active cart order can be changed",
          );
        }
        const paymentLinks =
          await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find(
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
          await this.dependencies.closeRemovedWork?.({
            customerId: props.subjectId,
            orderId: props.orderId,
          });
          await service.modules.ecommerce.order.delete({ id: props.orderId });
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
        const lines = await service.modules.ecommerce.ordersToProducts.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
          },
        });
        for (const line of lines) {
          const product = await service.modules.ecommerce.product.findById({
            id: line.productId,
          });
          if (
            product &&
            (await new InitialGrantProducts(
              service.modules.ecommerce.storesToProducts,
            ).includes(product.id))
          ) {
            throw new Error(
              "Permission error. Initial Free cannot be changed through a cart",
            );
          }
        }
        for (const line of props.lines) {
          await service.modules.ecommerce.ordersToProducts.update({
            id: line.id,
            data: { quantity: line.quantity, selectionUpdatedAt: new Date() },
          });
        }
      },
    );
  }
}

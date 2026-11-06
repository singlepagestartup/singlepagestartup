import { getDrizzle } from "@sps/shared-backend-database-config";
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import { INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG } from "@sps/shared-utils";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  currencyId: string;
}
export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleResolveOrderCurrency"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { service } = this.dependencies;
    await getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        await service.ecommerceModuleOrderAssertAccess({
          subjectId: props.subjectId,
          orderId: props.orderId,
        });
        await service.ecommerceModule.order.lockForLifecycle({
          id: props.orderId,
        });
        const order = await service.ecommerceModule.order.findById({
          id: props.orderId,
        });
        if (!order || order.type !== "cart" || order.status !== "new") {
          throw new Error(
            "Validation error. Only an active cart order can change currency",
          );
        }
        const lines = await service.ecommerceModule.ordersToProducts.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
          },
        });
        if (!lines?.length)
          throw new Error("Validation error. Order has no products");
        for (const line of lines) {
          const product = await service.ecommerceModule.product.findById({
            id: line.productId,
          });
          if (
            !product ||
            product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG
          ) {
            throw new Error(
              "Permission error. This product cannot be changed through a cart",
            );
          }
          await service.ecommerceModuleResolveOrderCurrency({
            productId: line.productId,
            billingModuleCurrencyId: props.currencyId,
          });
        }
        // Validate every line before the first write; normalize legacy duplicate links.
        const currencies =
          service.ecommerceModule.ordersToBillingModuleCurrencies;
        const links = await currencies.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
            orderBy: { and: [{ column: "id", method: "asc" }] },
          },
        });
        if (links?.length) {
          if (links[0].billingModuleCurrencyId !== props.currencyId) {
            await currencies.update({
              id: links[0].id,
              data: { billingModuleCurrencyId: props.currencyId },
            });
          }
          for (const link of links.slice(1))
            await currencies.delete({ id: link.id });
        } else {
          await currencies.create({
            data: {
              orderId: props.orderId,
              billingModuleCurrencyId: props.currencyId,
            },
          });
        }
      }),
    );
  }
}

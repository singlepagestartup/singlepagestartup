import { Service as InitialGrantProducts } from "../../billing/initial-grant-products";
import { getDrizzle } from "@sps/shared-backend-database-config";
import { withConsistencyDatabase } from "@sps/shared-backend-api";
import type { SubjectServiceDependencies } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  currencyId: string;
}
export interface IConstructorProps {
  service: SubjectServiceDependencies<
    "ecommerceModuleOrderAssertAccess" | "ecommerceModuleResolveOrderCurrency"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess({
      subjectId: props.subjectId,
      orderId: props.orderId,
    });
    const preparedLines = await service.modules.ecommerce.ordersToProducts.find(
      {
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.orderId }],
          },
        },
      },
    );
    for (const line of preparedLines.filter(
      (line: { parentLineId?: string | null; offerId?: string | null }) =>
        !line.parentLineId && line.offerId,
    )) {
      await service.ecommerceModuleResolveOrderCurrency({
        productId: line.productId,
        offerId: line.offerId ?? undefined,
        billingModuleCurrencyId: props.currencyId,
        destination: line.destination,
        services: preparedLines
          .filter(
            (child: { parentLineId?: string | null }) =>
              child.parentLineId === line.id,
          )
          .map((child) => ({
            offerId: child.offerId!,
            quantity: child.quantity,
          })),
      });
    }
    await getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        await service.ecommerceModuleOrderAssertAccess({
          subjectId: props.subjectId,
          orderId: props.orderId,
        });
        await service.modules.ecommerce.order.lockForLifecycle({
          id: props.orderId,
        });
        const order = await service.modules.ecommerce.order.findById({
          id: props.orderId,
        });
        if (!order || order.type !== "cart" || order.status !== "new") {
          throw new Error(
            "Validation error. Only an active cart order can change currency",
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
        const lines = await service.modules.ecommerce.ordersToProducts.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
          },
        });
        if (!lines?.length) {
          throw new Error("Validation error. Order has no products");
        }
        for (const line of lines.filter(
          (line: { parentLineId?: string | null }) => !line.parentLineId,
        )) {
          const product = await service.modules.ecommerce.product.findById({
            id: line.productId,
          });
          if (
            !product ||
            (await new InitialGrantProducts(
              service.modules.ecommerce.storesToProducts,
            ).includes(product.id))
          ) {
            throw new Error(
              "Permission error. This product cannot be changed through a cart",
            );
          }
          if (line.offerId) {
            const prepared = preparedLines.find(
              (entry: { id: string }) => entry.id === line.id,
            );
            if (
              !prepared ||
              prepared.offerId !== line.offerId ||
              prepared.quantity !== line.quantity ||
              new Date(prepared.selectionUpdatedAt).getTime() !==
                new Date(line.selectionUpdatedAt).getTime()
            ) {
              throw new Error(
                "Conflict error. Cart selection changed. Retry the currency choice",
              );
            }
          } else {
            await service.ecommerceModuleResolveOrderCurrency({
              productId: line.productId,
              billingModuleCurrencyId: props.currencyId,
            });
          }
        }
        // Validate every line before the first write; normalize legacy duplicate links.
        const currencies =
          service.modules.ecommerce.ordersToBillingModuleCurrencies;
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
          for (const link of links.slice(1)) {
            await currencies.delete({ id: link.id });
          }
        } else {
          await currencies.create({
            data: {
              orderId: props.orderId,
              billingModuleCurrencyId: props.currencyId,
            },
          });
        }
        for (const line of lines.filter(
          (line: { parentLineId?: string | null }) => !line.parentLineId,
        )) {
          await service.modules.ecommerce.ordersToProducts.update({
            id: line.id,
            data: {
              selectionUpdatedAt: new Date(),
              quoteVersion: null,
              quoteExpiresAt: null,
            },
          });
        }
      }),
    );
  }
}

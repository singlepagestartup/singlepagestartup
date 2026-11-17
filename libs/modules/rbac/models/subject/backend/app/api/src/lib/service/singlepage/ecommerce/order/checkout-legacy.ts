import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as ILine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IOfferQuoteInput } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";
import type { IEcommerceModule } from "../../../../di";

interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  ecommerceModule: IEcommerceModule;
  owners: SubjectService["subjectsToEcommerceModuleOrders"];
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: {
    subjectId: string;
    orders: IOrder[];
    lines: ILine[];
  }) {
    const { repository, ecommerceModule, owners } = this.dependencies;
    const legacy = props.orders.filter(
      (order) =>
        order.type === "cart" &&
        order.status === "new" &&
        !order.subscriptionSourceOrderId &&
        props.lines.some((line) => line.orderId === order.id && !line.offerId),
    );
    if (!legacy.length) {
      return;
    }
    const plans: {
      order: IOrder;
      line: ILine;
      input: IOfferQuoteInput;
      storeId: string;
    }[] = [];
    for (const order of legacy) {
      const lines = props.lines.filter((line) => line.orderId === order.id);
      if (lines.length !== 1 || lines[0].parentLineId) {
        throw new Error(
          "Conflict error. Choose one product and store for each order in this older cart before payment",
        );
      }
      const [stores, currencies] = await Promise.all([
        ecommerceModule.storesToOrders.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: order.id }],
            },
          },
        }),
        ecommerceModule.ordersToBillingModuleCurrencies.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: order.id }],
            },
          },
        }),
      ]);
      if (
        stores.length > 1 ||
        currencies.length !== 1 ||
        !currencies[0].billingModuleCurrencyId
      ) {
        throw new Error(
          "Conflict error. Choose one store and currency for this older cart before payment",
        );
      }
      const offers = await ecommerceModule.storesToProducts.offersForProduct({
        productId: lines[0].productId,
        ...(stores[0]?.storeId ? { storeId: stores[0].storeId } : {}),
      });
      if (offers.length !== 1) {
        throw new Error(
          "Conflict error. Choose one available retail offer for this older cart before payment",
        );
      }
      plans.push({
        order,
        line: lines[0],
        storeId: offers[0].storeId,
        input: {
          offerId: offers[0].id,
          quantity: lines[0].quantity,
          currencyId: currencies[0].billingModuleCurrencyId,
          lineId: lines[0].id,
          destination: lines[0].destination,
        },
      });
    }
    const quotes = await ecommerceModule.storesToProducts.quoteMany(
      plans.map((plan) => plan.input),
    );
    if (
      quotes.length !== plans.length ||
      quotes.some((quote) => quote.amount === null || quote.issues.length)
    ) {
      throw new Error(
        `Conflict error. Complete the store and delivery selection before payment: ${JSON.stringify(quotes.map((quote) => ({ offerId: quote.offerId, issues: quote.issues })))}`,
      );
    }
    for (const [index, plan] of plans.entries()) {
      plan.input.services =
        quotes[index].selectedServices ?? plan.input.services;
    }
    await repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        for (const order of [...legacy].sort((left, right) =>
          left.id.localeCompare(right.id),
        )) {
          await ecommerceModule.order.lockForLifecycle({ id: order.id });
        }
        const ownership = await owners.find({
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: legacy.map((order) => order.id),
                },
              ],
            },
          },
        });
        for (const plan of plans) {
          const links = ownership.filter(
            (owner) => owner.ecommerceModuleOrderId === plan.order.id,
          );
          if (
            !links.length ||
            links.some((owner) => owner.subjectId !== props.subjectId)
          ) {
            throw new Error(
              "Permission error. Checkout order is not owned by the current Subject",
            );
          }
        }
        await ecommerceModule.ordersToBillingModulePaymentIntents.lockOffers({
          offerIds: quotes.flatMap((quote) =>
            quote.charges.map((charge) => charge.offerId),
          ),
        });
        const currentQuotes =
          await ecommerceModule.storesToProducts.quotesUnderLock(
            plans.map((plan) => plan.input),
            quotes,
          );
        for (const [index, plan] of plans.entries()) {
          const order = await ecommerceModule.order.findById({
            id: plan.order.id,
          });
          const current = await ecommerceModule.ordersToProducts.findById({
            id: plan.line.id,
          });
          const currencies =
            await ecommerceModule.ordersToBillingModuleCurrencies.find({
              params: {
                filters: {
                  and: [
                    { column: "orderId", method: "eq", value: plan.order.id },
                  ],
                },
              },
            });
          if (
            !order ||
            order.type !== "cart" ||
            order.status !== "new" ||
            !current ||
            current.offerId ||
            current.orderId !== plan.order.id ||
            current.productId !== plan.line.productId ||
            current.quantity !== plan.line.quantity ||
            new Date(current.updatedAt).getTime() !==
              new Date(plan.line.updatedAt).getTime() ||
            currencies.length !== 1 ||
            currencies[0].billingModuleCurrencyId !== plan.input.currencyId
          ) {
            throw new Error(
              "Conflict error. Older cart selection changed during preparation",
            );
          }
          const payments =
            await ecommerceModule.ordersToBillingModulePaymentIntents.find({
              params: {
                filters: {
                  and: [{ column: "orderId", method: "eq", value: order.id }],
                },
              },
            });
          if (payments.length) {
            throw new Error(
              "Conflict error. Older cart already has a payment attempt",
            );
          }
          const stores = await ecommerceModule.storesToOrders.find({
            params: {
              filters: {
                and: [{ column: "orderId", method: "eq", value: order.id }],
              },
            },
          });
          if (
            stores.length > 1 ||
            (stores[0] && stores[0].storeId !== plan.storeId)
          ) {
            throw new Error(
              "Conflict error. Older cart store changed during preparation",
            );
          }
          if (!stores.length) {
            await ecommerceModule.storesToOrders.create({
              data: { orderId: order.id, storeId: plan.storeId },
            });
          }
          await ecommerceModule.ordersToProducts.update({
            id: current.id,
            data: {
              ...current,
              offerId: plan.input.offerId,
              quoteVersion: currentQuotes[index].version,
              quoteExpiresAt: new Date(currentQuotes[index].expiresAt),
              selectionUpdatedAt: new Date(),
            },
          });
          for (const selected of plan.input.services ?? []) {
            const charge = currentQuotes[index].charges.find(
              (charge) =>
                charge.offerId === selected.offerId &&
                charge.role !== "product",
            );
            if (!charge) {
              throw new Error(
                "Validation error. Selected service has no quoted charge",
              );
            }
            await ecommerceModule.ordersToProducts.create({
              data: {
                orderId: order.id,
                productId: charge.productId,
                offerId: selected.offerId,
                quantity: selected.quantity,
                recurrence: charge.recurrence,
                parentLineId: current.id,
                selectionUpdatedAt: new Date(),
              },
            });
          }
        }
      },
    );
    throw new Error(
      `Conflict error. Confirm the updated store offer and charges before paying: ${JSON.stringify(quotes.map((quote) => ({ offerId: quote.offerId, currencyId: quote.currencyId, amount: quote.amount, charges: quote.charges, version: quote.version, expiresAt: quote.expiresAt })))}`,
    );
  }
}

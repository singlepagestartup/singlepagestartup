import type { FindServiceProps } from "@sps/shared-backend-api";
import { assertSingleUnitPerOrder } from "@sps/backend-utils";
import {
  REGISTRATION_GRANT_VARIANT,
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
} from "@sps/shared-utils";
import { Service as InitialGrantProducts } from "../../billing/initial-grant-products";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOrderLine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IOfferQuote } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { Repository } from "../../../../repository";
import type { SubjectServiceDependencies } from "../../index";
import { randomUUID } from "node:crypto";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  mode?: "next-period";
}

export interface IResult {
  orderIds: string[];
}

export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: SubjectServiceDependencies<
    | "ecommerceModuleOrderRetryableIds"
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleResolveOrderCurrency"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<IResult> {
    if (props.mode === "next-period") {
      return this.nextPeriod(props);
    }
    const { repository, service } = this.dependencies;
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.ecommerceModuleOrderAssertAccess(props);
        const owners =
          await service.module.subjectsToEcommerceModuleOrders.find({
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
        const subjectOrderIds = owners.map(
          (owner: { ecommerceModuleOrderId: string }) =>
            owner.ecommerceModuleOrderId,
        );
        let carts: IOrder[] = [];
        if (subjectOrderIds.length) {
          carts = await service.modules.ecommerce.order.find({
            params: {
              filters: {
                and: [
                  { column: "id", method: "inArray", value: subjectOrderIds },
                  { column: "type", method: "eq", value: "cart" },
                  { column: "status", method: "eq", value: "new" },
                ],
              },
            },
          });
        }
        const lockedIds = [
          ...new Set([props.orderId, ...carts.map((cart) => cart.id)]),
        ].sort();
        for (const id of lockedIds) {
          await service.modules.ecommerce.order.lockForLifecycle({ id });
        }
        await service.ecommerceModuleOrderAssertAccess(props);
        const source = await service.modules.ecommerce.order.findById({
          id: props.orderId,
        });
        if (!source) {
          throw new Error("Not Found error. Order not found");
        }
        await this.assertExclusiveOwner(props.subjectId, source.id);
        const retryableIds = await service.ecommerceModuleOrderRetryableIds({
          orders: [source],
        });
        if (!retryableIds.has(source.id)) {
          throw new Error(
            "Conflict error. Only an unpaid history order can be repeated",
          );
        }

        const sourceFilters: NonNullable<
          NonNullable<FindServiceProps["params"]>["filters"]
        > = {
          and: [{ column: "orderId", method: "eq", value: source.id }],
        };
        const lines: IOrderLine[] =
          await service.modules.ecommerce.ordersToProducts.find({
            params: { filters: sourceFilters },
          });
        if (!lines.length) {
          throw new Error("Validation error. Source order has no products");
        }
        const stores = await service.modules.ecommerce.storesToOrders.find({
          params: { filters: sourceFilters },
        });
        if (stores.length !== 1 || !stores[0].storeId) {
          throw new Error("Validation error. Source order must have one store");
        }
        const storeId: string = stores[0].storeId;
        const store = await service.modules.ecommerce.store.findById({
          id: storeId,
        });
        if (!store) {
          throw new Error(
            "Validation error. Source order store is unavailable",
          );
        }
        const currencies =
          await service.modules.ecommerce.ordersToBillingModuleCurrencies.find({
            params: { filters: sourceFilters },
          });
        if (currencies.length !== 1 || !currencies[0].billingModuleCurrencyId) {
          throw new Error(
            "Validation error. Source order must have one currency",
          );
        }
        const billingModuleCurrencyId: string =
          currencies[0].billingModuleCurrencyId;
        const currency = await service.modules.billing.currency.findById({
          id: billingModuleCurrencyId,
        });
        if (!currency) {
          throw new Error(
            "Validation error. Source order currency is unavailable",
          );
        }
        const primaryProductIds = new Set<string>();
        for (const line of lines) {
          if (
            !Number.isInteger(line.quantity) ||
            line.quantity < quantityBounds.min ||
            line.quantity > quantityBounds.max
          ) {
            throw new Error(
              `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
            );
          }
          const product = await service.modules.ecommerce.product.findById({
            id: line.productId,
          });
          if (!product) {
            throw new Error(
              "Validation error. Source order product is unavailable",
            );
          }
          if (!line.parentLineId) {
            const quantity = primaryProductIds.has(line.productId)
              ? 2
              : line.quantity;
            assertSingleUnitPerOrder(product, quantity);
            primaryProductIds.add(line.productId);
          }
          if (
            await new InitialGrantProducts(
              service.modules.ecommerce.storesToProducts,
            ).includes(product.id)
          ) {
            throw new Error(
              "Permission error. Initial Free is available only through authentication bootstrap",
            );
          }
          if (line.offerId) {
            continue;
          }
          const resolvedCurrencyId =
            await service.ecommerceModuleResolveOrderCurrency({
              productId: line.productId,
              billingModuleCurrencyId,
            });
          if (resolvedCurrencyId !== billingModuleCurrencyId) {
            throw new Error(
              "Validation error. Source order currency is unavailable",
            );
          }
        }
        if (!lines.some((line) => line.offerId)) {
          await service.modules.ecommerce.order.findByIdCheckoutAttributesByCurrency(
            {
              id: source.id,
              billingModuleCurrencyId,
            },
          );
        }

        const replaceable: IOrder[] = [];
        for (const cart of carts) {
          await service.ecommerceModuleOrderAssertAccess({
            ...props,
            orderId: cart.id,
          });
          const current = await service.modules.ecommerce.order.findById({
            id: cart.id,
          });
          if (current?.type !== "cart" || current.status !== "new") {
            continue;
          }
          await this.assertExclusiveOwner(props.subjectId, current.id);
          await this.assertNoPaymentAttempt(current.id);
          replaceable.push(current);
        }
        // The source and every cart have been validated before the first write.
        for (const cart of replaceable) {
          await service.modules.ecommerce.order.delete({ id: cart.id });
        }
        const order = await service.modules.ecommerce.order.create({
          data: { type: "cart", status: "new" },
        });
        if (!order) {
          throw new Error("Not Found error. No order found");
        }
        const owner =
          await service.module.subjectsToEcommerceModuleOrders.create({
            data: {
              subjectId: props.subjectId,
              ecommerceModuleOrderId: order.id,
            },
          });
        if (!owner) {
          throw new Error("Not Found error. No order owner found");
        }
        const createdLineIds = new Map<string, string>();
        for (const line of [...lines].sort(
          (left, right) =>
            Number(Boolean(left.parentLineId)) -
            Number(Boolean(right.parentLineId)),
        )) {
          const parentLineId = line.parentLineId
            ? createdLineIds.get(line.parentLineId)
            : null;
          if (line.parentLineId && !parentLineId) {
            throw new Error(
              "Validation error. Source service has no primary item",
            );
          }
          let destination = line.destination;
          if (destination && "pickupPointId" in destination) {
            const {
              pickupPointId: _legacyPickupPointId,
              ...currentDestination
            } = destination;
            destination = currentDestination;
          }
          const created =
            await service.modules.ecommerce.ordersToProducts.create({
              data: {
                orderId: order.id,
                productId: line.productId,
                quantity: line.quantity,
                ...(line.offerId
                  ? {
                      offerId: line.offerId,
                      parentLineId,
                      destination,
                      recurrence: line.recurrence,
                      quoteVersion: line.quoteVersion,
                      quoteExpiresAt: line.quoteExpiresAt,
                    }
                  : {}),
              },
            });
          if (!created) {
            throw new Error("Not Found error. No orders to products found");
          }
          createdLineIds.set(line.id, created.id);
        }
        const storeLink = await service.modules.ecommerce.storesToOrders.create(
          {
            data: { orderId: order.id, storeId },
          },
        );
        if (!storeLink) {
          throw new Error("Not Found error. No stores to orders found");
        }
        const currencyLink =
          await service.modules.ecommerce.ordersToBillingModuleCurrencies.create(
            {
              data: { orderId: order.id, billingModuleCurrencyId },
            },
          );
        if (!currencyLink) {
          throw new Error(
            "Not Found error. No orders to billing module currencies found",
          );
        }
        return { orderIds: [order.id] };
      },
    );
  }

  private async nextPeriod(props: IExecuteProps): Promise<IResult> {
    const { repository, service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    const source = await service.modules.ecommerce.order.findById({
      id: props.orderId,
    });
    if (
      !source ||
      source.type !== "history" ||
      !source.subscriptionPeriodInvoiceId ||
      source.subscriptionRevokedAt ||
      ["requested_cancelation", "canceling", "canceled", "completed"].includes(
        source.status,
      ) ||
      !source.subscriptionPeriodEndsAt ||
      new Date(
        source.subscriptionScheduledEndsAt ?? source.subscriptionPeriodEndsAt,
      ).getTime() >
        Date.now() + 24 * 60 * 60 * 1000
    ) {
      throw new Error(
        "Conflict error. A separately paid subscription period is not due",
      );
    }
    const paymentLinks: IPaymentLink[] =
      await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find(
        {
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: source.id }],
            },
          },
        },
      );
    const invoiceLinks =
      await service.modules.billing.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "invoiceId",
                method: "eq",
                value: source.subscriptionPeriodInvoiceId!,
              },
            ],
          },
        },
      });
    const intentIds = [
      ...new Set<string>(
        (invoiceLinks as { paymentIntentId: string }[])
          .map((link) => link.paymentIntentId)
          .filter((id) =>
            paymentLinks.some(
              (link) => link.billingModulePaymentIntentId === id,
            ),
          ),
      ),
    ];
    if (intentIds.length !== 1) {
      throw new Error(
        "Conflict error. Saved subscription payment is ambiguous",
      );
    }
    const [intent, invoice] = await Promise.all([
      service.modules.ecommerce.order.paymentIntent.findById({
        id: intentIds[0],
      }),
      service.modules.billing.invoice.findById({
        id: source.subscriptionPeriodInvoiceId,
      }),
    ]);
    const snapshots = paymentLinks
      .filter(
        (link) =>
          link.billingModulePaymentIntentId === intentIds[0] &&
          link.purchaseSnapshot,
      )
      .map((link) => link.purchaseSnapshot!);
    if (
      !snapshots.length &&
      intent?.status === "succeeded" &&
      invoice?.status === "paid"
    ) {
      return this.legacyNextPeriodCart(props, source, intent.id);
    }
    const main = snapshots.find(
      (snapshot) => snapshot.charge.role === "product",
    );
    if (
      !intent ||
      !["one_off", "subscription"].includes(intent.type) ||
      intent.status !== "succeeded" ||
      invoice?.status !== "paid" ||
      !main ||
      main.purchaseType !== "subscription" ||
      !main.interval
    ) {
      throw new Error(
        "Conflict error. Next period requires a confirmed separately paid subscription",
      );
    }
    const prior = await service.modules.ecommerce.order.find({
      params: {
        filters: {
          and: [
            {
              column: "subscriptionSourceOrderId",
              method: "eq",
              value: source.id,
            },
            {
              column: "subscriptionSourceInvoiceId",
              method: "eq",
              value: source.subscriptionPeriodInvoiceId!,
            },
          ],
        },
      },
    });
    if (prior.length) {
      if (prior.length !== 1) {
        throw new Error(
          "Conflict error. Next subscription period is ambiguous",
        );
      }
      await service.ecommerceModuleOrderAssertAccess({
        ...props,
        orderId: prior[0].id,
      });
      return { orderIds: [prior[0].id] };
    }
    const primaryId = randomUUID();
    const selected = snapshots.filter(
      (snapshot) =>
        snapshot.charge.role === "product" ||
        snapshot.charge.recurrence === "each",
    );
    const childIds = new Map(
      selected
        .filter((snapshot) => snapshot.charge.role !== "product")
        .map((snapshot) => [snapshot.charge.offerId, randomUUID()]),
    );
    const input = {
      offerId: main.charge.offerId,
      quantity: main.charge.quantity,
      currencyId: main.currencyId,
      lineId: primaryId,
      destination: main.destination,
      services: selected
        .filter((snapshot) => snapshot.charge.role !== "product")
        .map((snapshot) => ({
          offerId: snapshot.charge.offerId,
          quantity: snapshot.charge.quantity,
          lineId: childIds.get(snapshot.charge.offerId)!,
        })),
    };
    // Delivery routing and current prices resolve before acquiring database locks.
    const fulfillment =
      await service.modules.ecommerce.order.fulfillmentQuoteOptions({
        id: source.id,
      });
    const quoteOptions = fulfillment.fulfilledLineIds.length
      ? { fulfilledLineIds: [primaryId] }
      : undefined;
    let quote: IOfferQuote;
    if (quoteOptions) {
      quote = await service.modules.ecommerce.storesToProducts.quote(
        input,
        quoteOptions,
      );
    } else {
      quote = await service.modules.ecommerce.storesToProducts.quote(input);
    }
    if (quote.amount === null || quote.issues.length) {
      throw new Error(
        `Conflict error. Next delivery is unavailable: ${JSON.stringify(quote.issues)}`,
      );
    }
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.modules.ecommerce.order.lockForLifecycle({
          id: source.id,
        });
        await service.ecommerceModuleOrderAssertAccess(props);
        await this.assertExclusiveOwner(props.subjectId, source.id);
        const current = await service.modules.ecommerce.order.findById({
          id: source.id,
        });
        if (
          !current ||
          current.subscriptionRevokedAt ||
          [
            "requested_cancelation",
            "canceling",
            "canceled",
            "completed",
          ].includes(current.status) ||
          current.subscriptionPeriodInvoiceId !==
            source.subscriptionPeriodInvoiceId ||
          !current.subscriptionPeriodEndsAt ||
          new Date(
            current.subscriptionScheduledEndsAt ??
              current.subscriptionPeriodEndsAt,
          ).getTime() >
            Date.now() + 24 * 60 * 60 * 1000
        ) {
          throw new Error(
            "Conflict error. Subscription period changed during renewal",
          );
        }
        const existing = await service.modules.ecommerce.order.find({
          params: {
            filters: {
              and: [
                {
                  column: "subscriptionSourceOrderId",
                  method: "eq",
                  value: source.id,
                },
                {
                  column: "subscriptionSourceInvoiceId",
                  method: "eq",
                  value: source.subscriptionPeriodInvoiceId!,
                },
              ],
            },
          },
        });
        if (existing.length) {
          if (existing.length !== 1) {
            throw new Error(
              "Conflict error. Next subscription period is ambiguous",
            );
          }
          await service.ecommerceModuleOrderAssertAccess({
            ...props,
            orderId: existing[0].id,
          });
          return { orderIds: [existing[0].id] };
        }
        const order =
          await service.modules.ecommerce.order.createNextPeriodCart({
            sourceOrderId: source.id,
            sourceInvoiceId: source.subscriptionPeriodInvoiceId!,
            interval: main.interval!,
          });
        await service.module.subjectsToEcommerceModuleOrders.create({
          data: {
            subjectId: props.subjectId,
            ecommerceModuleOrderId: order.id,
          },
        });
        await service.modules.ecommerce.storesToOrders.create({
          data: { orderId: order.id, storeId: quote.storeId },
        });
        await service.modules.ecommerce.ordersToBillingModuleCurrencies.create({
          data: {
            orderId: order.id,
            billingModuleCurrencyId: quote.currencyId,
          },
        });
        const charges = [...quote.charges].sort(
          (left, right) =>
            Number(left.role !== "product") - Number(right.role !== "product"),
        );
        let createdPrimaryId: string | undefined;
        for (const charge of charges) {
          const primary = charge.role === "product";
          if (!primary && !createdPrimaryId) {
            throw new Error(
              "Validation error. Next delivery has no primary line",
            );
          }
          const created =
            await service.modules.ecommerce.ordersToProducts.create({
              data: {
                orderId: order.id,
                productId: charge.productId,
                offerId: charge.offerId,
                parentLineId: primary ? null : createdPrimaryId,
                quantity: charge.quantity,
                recurrence: charge.recurrence,
                destination: primary
                  ? (quote.destination ?? input.destination)
                  : {},
                quoteVersion: primary ? quote.version : null,
                quoteExpiresAt: primary ? new Date(quote.expiresAt) : null,
              },
            });
          if (primary) {
            createdPrimaryId = created.id;
          }
        }
        return { orderIds: [order.id] };
      },
    );
  }

  private async legacyNextPeriodCart(
    props: IExecuteProps,
    source: IOrder,
    intentId: string,
  ): Promise<IResult> {
    const { service, repository } = this.dependencies;
    const extended = await service.modules.ecommerce.order.findByIdExtended({
      id: source.id,
    });
    const primary = extended.ordersToProducts.filter(
      (line: IOrderLine) => !line.parentLineId,
    );
    if (
      primary.length !== 1 ||
      extended.ordersToProducts.length !== 1 ||
      extended.checkoutAttributesByCurrency.type !== "subscription" ||
      !extended.checkoutAttributesByCurrency.interval
    ) {
      throw new Error(
        "Conflict error. Legacy subscription delivery requires reconciliation",
      );
    }
    const line = primary[0];
    assertSingleUnitPerOrder(line.product, line.quantity);
    if (line.product?.kind === "physical") {
      throw new Error(
        "Conflict error. Legacy physical subscription needs an offer for stock reservation",
      );
    }
    if (
      extended.variant === REGISTRATION_GRANT_VARIANT ||
      (await new InitialGrantProducts(
        service.modules.ecommerce.storesToProducts,
      ).includes(line.productId))
    ) {
      throw new Error("Permission error. Initial Free cannot be renewed");
    }
    const [shared, currencies, stores] = await Promise.all([
      service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "eq",
                value: intentId,
              },
            ],
          },
        },
      }),
      service.modules.ecommerce.ordersToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: source.id }],
          },
        },
      }),
      service.modules.ecommerce.storesToOrders.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: source.id }],
          },
        },
      }),
    ]);
    if (
      shared.some((link: IPaymentLink) => link.orderId !== source.id) ||
      currencies.length !== 1 ||
      stores.length > 1
    ) {
      throw new Error(
        "Conflict error. Legacy subscription payment allocation requires reconciliation",
      );
    }
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.modules.ecommerce.order.lockForLifecycle({
          id: source.id,
        });
        await service.ecommerceModuleOrderAssertAccess(props);
        await this.assertExclusiveOwner(props.subjectId, source.id);
        const current = await service.modules.ecommerce.order.findById({
          id: source.id,
        });
        if (
          !current ||
          current.subscriptionRevokedAt ||
          [
            "requested_cancelation",
            "canceling",
            "canceled",
            "completed",
          ].includes(current.status) ||
          current.subscriptionPeriodInvoiceId !==
            source.subscriptionPeriodInvoiceId
        ) {
          throw new Error(
            "Conflict error. Subscription period changed during renewal",
          );
        }
        const existing = await service.modules.ecommerce.order.find({
          params: {
            filters: {
              and: [
                {
                  column: "subscriptionSourceOrderId",
                  method: "eq",
                  value: source.id,
                },
                {
                  column: "subscriptionSourceInvoiceId",
                  method: "eq",
                  value: source.subscriptionPeriodInvoiceId!,
                },
              ],
            },
          },
        });
        if (existing.length) {
          if (existing.length !== 1) {
            throw new Error(
              "Conflict error. Next subscription period is ambiguous",
            );
          }
          await service.ecommerceModuleOrderAssertAccess({
            subjectId: props.subjectId,
            orderId: existing[0].id,
          });
          return { orderIds: [existing[0].id] };
        }
        const order =
          await service.modules.ecommerce.order.createNextPeriodCart({
            sourceOrderId: source.id,
            sourceInvoiceId: source.subscriptionPeriodInvoiceId!,
            interval: extended.checkoutAttributesByCurrency.interval!,
          });
        await service.module.subjectsToEcommerceModuleOrders.create({
          data: {
            subjectId: props.subjectId,
            ecommerceModuleOrderId: order.id,
          },
        });
        await service.modules.ecommerce.ordersToBillingModuleCurrencies.create({
          data: {
            orderId: order.id,
            billingModuleCurrencyId: currencies[0].billingModuleCurrencyId,
          },
        });
        for (const store of stores) {
          await service.modules.ecommerce.storesToOrders.create({
            data: { orderId: order.id, storeId: store.storeId },
          });
        }
        await service.modules.ecommerce.ordersToProducts.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            quantity: line.quantity,
            destination: line.destination,
            recurrence: "each",
          },
        });
        return { orderIds: [order.id] };
      },
    );
  }

  private async assertExclusiveOwner(
    subjectId: string,
    orderId: string,
  ): Promise<void> {
    const owners =
      await this.dependencies.service.module.subjectsToEcommerceModuleOrders.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "eq",
                  value: orderId,
                },
              ],
            },
          },
        },
      );
    if (
      !owners.length ||
      owners.some((owner) => owner.subjectId !== subjectId)
    ) {
      throw new Error(
        "Permission error. Order must belong only to the current subject",
      );
    }
  }

  private async assertNoPaymentAttempt(orderId: string): Promise<void> {
    const { ecommerce } = this.dependencies.service.modules;
    const links =
      await ecommerce.order.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    if (links.length) {
      throw new Error(
        "Conflict error. Cart has a payment attempt and cannot be replaced",
      );
    }
  }
}

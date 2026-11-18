import { Service as InitialGrantProducts } from "../../billing/initial-grant-products";
import { Service as CheckoutClaim } from "../../../startup/ecommerce/order/checkout-claim";
import type { Repository } from "../../../../repository";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { type IBillingModule, type IEcommerceModule } from "../../../../di";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import {
  type IModel as IBillingModulePaymentIntent,
  paymentProviderPrecision,
} from "@sps/billing/models/payment-intent/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as broadcastModuleChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import {
  addMoney,
  parseExactMonetaryAmount,
  moneyFromMinorUnits,
  moneyMinorUnits,
  providerMinorUnits,
} from "@sps/backend-utils";
import { isSupportedOrderInterval } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes";
import type {
  IOfferQuote,
  IOfferQuoteInput,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IReservationLine } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service/singlepage/reservation";

export const ACTIVE_SUBSCRIPTION_ORDER_STATUSES = [
  "paying",
  "paid",
  "approving",
  "packaging",
  "delivering",
  "delivered",
];

export type IExecuteProps =
  | {
      id: string;
      email?: string;
      provider: string;
      account?: string | null;
      comment?: string;
      billingModule?: {
        currency?: {
          id?: string;
        };
      };
      ecommerceModule: {
        orders: {
          id: string;
        }[];
      };
    }
  | {
      id: string;
      account?: string | null;
      provider: "telegram-star";
      comment?: string;
      billingModule?: {
        currency?: {
          id?: string;
        };
      };
      ecommerceModule: {
        orders: {
          id: string;
        }[];
      };
    };

export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  settledOrderIds: (props: { orderIds: string[] }) => Promise<Set<string>>;
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
}

export class Service {
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(private readonly dependencies: IConstructorProps) {
    const props = dependencies;
    this.findById = props.findById;
    this.ecommerceModule = props.ecommerceModule;
    this.billingModule = props.billingModule;
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  async execute(
    props: IExecuteProps,
    internal?: {
      deferProviderCheckout?: boolean;
      manualSubscriptionPeriod?: boolean;
      providerContractPaymentIntentId?: string;
    },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }
    const rbacSecretKey = RBAC_SECRET_KEY;

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Not Found error. No entity found");
    }

    const ecommerceModuleOrders = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: props.ecommerceModule.orders.map(
                (order: { id: string }) => order.id,
              ),
            },
          ],
        },
      },
    });

    if (!ecommerceModuleOrders?.length) {
      throw new Error("Not Found error. No ecommerce module orders found");
    }

    const ordersToProducts = await this.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: ecommerceModuleOrders.map((order) => order.id),
            },
          ],
        },
      },
    });

    if (!ordersToProducts?.length) {
      throw new Error("Not Found error. No orders to products found");
    }
    if (
      ecommerceModuleOrders.some(
        (order) =>
          !ordersToProducts.some(
            (line) => line.orderId === order.id && line.productId,
          ),
      )
    ) {
      throw new Error(
        "Validation error. Every checkout order must have products",
      );
    }
    const existingPaymentLinks =
      await this.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: ecommerceModuleOrders.map((order) => order.id),
              },
            ],
          },
        },
      });
    if (existingPaymentLinks.length) {
      const existing = await new CheckoutClaim({
        repository: this.dependencies.repository,
        ecommerceModule: this.ecommerceModule,
        billingModule: this.billingModule,
        subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
        settledOrderIds: this.dependencies.settledOrderIds,
      }).execute({
        subjectId: props.id,
        orderIds: ecommerceModuleOrders.map((order) => order.id),
        resumeExisting: true,
        comment: props.comment,
      });
      if (existing.invoices) {
        const trustedIntent = await this.billingModule.paymentIntent.findById({
          id: existingPaymentLinks[0].billingModulePaymentIntentId,
        });
        await this.registerCheckoutObservers({
          orderIds: ecommerceModuleOrders.map((order) => order.id),
          subjectId: props.id,
          provider:
            existing.invoices[0]?.provider ||
            trustedIntent?.checkoutProvider ||
            props.provider,
        });
        if (
          !internal?.deferProviderCheckout &&
          !trustedIntent?.checkoutMetadata?.providerContractPaymentIntentId
        ) {
          await this.resumePreparedCheckout(
            existing.preparedPaymentIntentIds ?? [],
          );
        }
        if (existing.preparedPaymentIntentIds?.length) {
          return this.existingAttemptInvoices(
            existing.preparedPaymentIntentIds,
            existing.invoices,
          );
        }
        return { billingModule: { invoices: existing.invoices } };
      }
    }

    const hasUnselectedOffer = ecommerceModuleOrders.some(
      (order) =>
        order.type === "cart" &&
        order.status === "new" &&
        !order.subscriptionSourceOrderId &&
        ordersToProducts.some(
          (line) => line.orderId === order.id && !line.offerId,
        ),
    );
    if (hasUnselectedOffer) {
      throw new Error(
        "Conflict error. Select and save a store offer in the cart before payment",
      );
    }

    const ecommerceModuleProducts = await this.ecommerceModule.product.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ordersToProducts.map(
                (orderToProduct) => orderToProduct.productId,
              ),
            },
          ],
        },
      },
    });

    if (!ecommerceModuleProducts?.length) {
      throw new Error("Not Found error. No ecommerce module products found");
    }

    if (
      await new InitialGrantProducts(
        this.ecommerceModule.storesToProducts,
      ).includesAny(ecommerceModuleProducts.map((product) => product.id))
    ) {
      throw new Error(
        "Permission error. Initial Free is available only through authentication bootstrap",
      );
    }

    const ecommerceModuleProductsToAttributes =
      await this.ecommerceModule.productsToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "inArray",
                value: ecommerceModuleProducts.map(
                  (ecommerceModuleProduct) => ecommerceModuleProduct.id,
                ),
              },
            ],
          },
        },
      });

    const offerBacked = ordersToProducts.every((line) => line.offerId);
    if (!ecommerceModuleProductsToAttributes?.length && !offerBacked) {
      throw new Error(
        "Not Found error. No ecommerce module products to attributes found",
      );
    }

    const ecommerceModuleAttributesKeysToAttributes =
      await this.ecommerceModule.attributeKeysToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleProductsToAttributes.map(
                  (ecommerceModuleProductToAttribute) =>
                    ecommerceModuleProductToAttribute.attributeId,
                ),
              },
            ],
          },
        },
      });

    if (!ecommerceModuleAttributesKeysToAttributes?.length && !offerBacked) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys to attributes found",
      );
    }

    const ecommerceModuleAttributesKeys =
      await this.ecommerceModule.attributeKey.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleAttributesKeysToAttributes.map(
                  (ecommerceModuleAttributesKeysToAttribute) =>
                    ecommerceModuleAttributesKeysToAttribute.attributeKeyId,
                ),
              },
            ],
          },
        },
      });

    if (!ecommerceModuleAttributesKeysToAttributes?.length && !offerBacked) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys to attributes found",
      );
    }

    if (!ecommerceModuleAttributesKeys?.length && !offerBacked) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys found",
      );
    }

    const ecommerceModuleAttributes = await this.ecommerceModule.attribute.find(
      {
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleProductsToAttributes.map(
                  (ecommerceModuleProductToAttribute) =>
                    ecommerceModuleProductToAttribute.attributeId,
                ),
              },
            ],
          },
        },
      },
    );

    if (!ecommerceModuleAttributes?.length && !offerBacked) {
      throw new Error("Not Found error. No ecommerce module attributes found");
    }

    const ecommerceModuleAttributesToBillingModuleCurrencies =
      await this.ecommerceModule.attributesToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleAttributes.map(
                  (ecommerceModuleAttribute) => ecommerceModuleAttribute.id,
                ),
              },
            ],
          },
        },
      });

    const billingModuleCurrencies = await this.billingModule.currency.find({});

    const metadata:
      | {
          ecommerceModule: any;
          email: string;
          comment: string;
        }
      | {
          ecommerceModule: any;
          account: string;
          comment: string;
        } = {
      ecommerceModule: {
        orders: ecommerceModuleOrders.map((ecommerceModuleOrder) => {
          return {
            ...ecommerceModuleOrder,
            ordersToProducts: ordersToProducts
              .filter((orderToProduct) => {
                return orderToProduct.orderId === ecommerceModuleOrder.id;
              })
              .map((orderToProduct) => {
                return {
                  ...orderToProduct,
                  products: ecommerceModuleProducts
                    ?.filter((ecommerceModuleProduct) => {
                      return (
                        ecommerceModuleProduct.id === orderToProduct.productId
                      );
                    })
                    ?.map((ecommerceModuleProduct) => {
                      return {
                        ...ecommerceModuleProduct,
                        productsToAttributes:
                          ecommerceModuleProductsToAttributes
                            .filter((ecommerceModuleProductToAttribute) => {
                              return (
                                ecommerceModuleProductToAttribute.productId ===
                                ecommerceModuleProduct.id
                              );
                            })
                            .map((ecommerceModuleProductToAttribute) => {
                              return {
                                ...ecommerceModuleProductToAttribute,
                                attributes: ecommerceModuleAttributes
                                  .filter((ecommerceModuleAttribute) => {
                                    return (
                                      ecommerceModuleAttribute.id ===
                                      ecommerceModuleProductToAttribute.attributeId
                                    );
                                  })
                                  .map((ecommerceModuleAttribute) => {
                                    return {
                                      ...ecommerceModuleAttribute,
                                      attributesKeysToAttributes:
                                        ecommerceModuleAttributesKeysToAttributes
                                          .filter(
                                            (
                                              ecommerceModuleAttributesKeysToAttribute,
                                            ) => {
                                              return (
                                                ecommerceModuleAttributesKeysToAttribute.attributeId ===
                                                ecommerceModuleProductToAttribute.attributeId
                                              );
                                            },
                                          )
                                          .map(
                                            (
                                              ecommerceModuleAttributesKeysToAttribute,
                                            ) => {
                                              return {
                                                ...ecommerceModuleAttributesKeysToAttribute,
                                                attributeKey:
                                                  ecommerceModuleAttributesKeys.find(
                                                    (
                                                      ecommerceModuleAttributesKey,
                                                    ) => {
                                                      return (
                                                        ecommerceModuleAttributesKey.id ===
                                                        ecommerceModuleAttributesKeysToAttribute.attributeKeyId
                                                      );
                                                    },
                                                  ),
                                              };
                                            },
                                          ),
                                      attributesToBillingModuleCurrencies:
                                        ecommerceModuleAttributesToBillingModuleCurrencies
                                          ?.filter(
                                            (
                                              ecommerceModuleAttributeToBillingModuleCurrency,
                                            ) => {
                                              return (
                                                ecommerceModuleAttributeToBillingModuleCurrency.attributeId ===
                                                ecommerceModuleAttribute.id
                                              );
                                            },
                                          )
                                          .map(
                                            (
                                              ecommerceModuleAttributeToBillingModuleCurrency,
                                            ) => {
                                              return {
                                                ...ecommerceModuleAttributeToBillingModuleCurrency,
                                                billingModuleCurrency:
                                                  billingModuleCurrencies?.find(
                                                    (billingModuleCurrency) =>
                                                      billingModuleCurrency.id ===
                                                      ecommerceModuleAttributeToBillingModuleCurrency.billingModuleCurrencyId,
                                                  ),
                                              };
                                            },
                                          ),
                                    };
                                  }),
                              };
                            }),
                      };
                    }),
                };
              }),
          };
        }),
      },
      account: props.account || "",
      email: props["email"],
      comment: props.comment || "",
    };

    const ordersToBillingModuleCurrencies =
      await this.ecommerceModule.ordersToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: ecommerceModuleOrders.map((order) => order.id),
              },
            ],
          },
        },
      });

    if (!ordersToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not Found error. No orders to billing module currencies found",
      );
    }

    const checkoutAttributesByOrderId = new Map<
      string,
      {
        amount: number;
        type: string;
        interval?: string;
      }
    >();
    const orderQuotes = new Map<
      string,
      { input: IOfferQuoteInput; quote: IOfferQuote }
    >();
    const separatePeriodOrderIds = new Set<string>();
    const offerSelections: {
      order: (typeof ecommerceModuleOrders)[number];
      main: (typeof ordersToProducts)[number];
      input: IOfferQuoteInput;
    }[] = [];
    for (const order of ecommerceModuleOrders) {
      const lines = ordersToProducts.filter(
        (line) => line.orderId === order.id,
      );
      if (!lines.length) {
        throw new Error(
          "Validation error. Every checkout order must have products",
        );
      }
      const currencyLinks = ordersToBillingModuleCurrencies.filter(
        (link) => link.orderId === order.id,
      );
      if (
        currencyLinks.length !== 1 ||
        !currencyLinks[0].billingModuleCurrencyId
      ) {
        throw new Error(
          "Validation error. Checkout order must have one currency",
        );
      }
      const primary = lines.filter((line) => !line.parentLineId);
      if (!primary.some((line) => line.offerId)) {
        const attributes =
          await this.ecommerceModule.order.findByIdCheckoutAttributesByCurrency(
            {
              id: order.id,
              billingModuleCurrencyId: currencyLinks[0].billingModuleCurrencyId,
            },
          );
        checkoutAttributesByOrderId.set(order.id, attributes);
        continue;
      }
      if (
        primary.length !== 1 ||
        !primary[0].offerId ||
        lines.some((line) => !line.offerId)
      ) {
        throw new Error(
          "Validation error. An offer order must contain one primary item and its services",
        );
      }
      const main = primary[0];
      offerSelections.push({
        order,
        main,
        input: {
          offerId: main.offerId!,
          quantity: main.quantity,
          currencyId: currencyLinks[0].billingModuleCurrencyId,
          lineId: main.id,
          destination: main.destination,
          services: lines
            .filter((line) => line.parentLineId === main.id)
            .map((line) => ({
              offerId: line.offerId!,
              quantity: line.quantity,
              lineId: line.id,
            })),
        },
      });
    }
    const fulfilledLineIds: string[] = [];
    for (const { order } of offerSelections) {
      if (order.subscriptionSourceOrderId) {
        const fulfillment =
          await this.ecommerceModule.order.fulfillmentQuoteOptions({
            id: order.id,
          });
        fulfilledLineIds.push(...fulfillment.fulfilledLineIds);
      }
    }
    const quoteOptions = fulfilledLineIds.length
      ? { fulfilledLineIds }
      : undefined;
    let previews: IOfferQuote[] = [];
    if (offerSelections.length) {
      const inputs = offerSelections.map((selection) => selection.input);
      if (quoteOptions) {
        previews = await this.ecommerceModule.storesToProducts.quoteMany(
          inputs,
          quoteOptions,
        );
      } else {
        previews =
          await this.ecommerceModule.storesToProducts.quoteMany(inputs);
      }
    }
    if (previews.length !== offerSelections.length) {
      throw new Error(
        "Configuration error. Checkout quote batch is incomplete",
      );
    }
    const intervalKeyIds = new Set(
      ecommerceModuleAttributesKeys
        .filter((key) => key.type === "interval")
        .map((key) => key.id),
    );
    for (const [index, selection] of offerSelections.entries()) {
      const { order, main, input } = selection;
      const quote = previews[index];
      if (quote.amount === null || quote.issues.length) {
        throw new Error(
          `Conflict error. Checkout quote is unavailable: ${JSON.stringify(quote.issues)}`,
        );
      }
      const lines = ordersToProducts.filter(
        (line) => line.orderId === order.id,
      );
      if (
        quote.charges.some(
          (charge) =>
            !lines.some(
              (line) =>
                line.offerId === charge.offerId &&
                line.quantity === charge.quantity &&
                (charge.role === "product"
                  ? !line.parentLineId
                  : line.parentLineId === main.id),
            ),
        )
      ) {
        throw new Error(
          "Conflict error. Save the current cart service selection before payment",
        );
      }
      if (main.quoteVersion && main.quoteVersion !== quote.version) {
        throw new Error(
          `Conflict error. Checkout price changed: ${JSON.stringify({ orderId: order.id, lineId: main.id, amount: quote.amount, currencyId: quote.currencyId, charges: quote.charges, version: quote.version, expiresAt: quote.expiresAt })}`,
        );
      }
      const currency = billingModuleCurrencies.find(
        (entry) => entry.id === input.currencyId,
      );
      if (!currency) {
        throw new Error("Not Found error. Checkout currency is unavailable");
      }
      providerMinorUnits(
        quote.amount,
        paymentProviderPrecision(props.provider, currency),
      );
      const primaryProduct = ecommerceModuleProducts.find(
        (product) => product.id === main.productId,
      );
      const type = order.subscriptionSourceOrderId
        ? "subscription"
        : primaryProduct?.type;
      if (type !== "one_off" && type !== "subscription") {
        throw new Error(
          "Validation error. Checkout product has unsupported payment terms",
        );
      }
      let interval: string | undefined;
      if (type === "subscription") {
        const intervalValues = new Set<string>();
        for (const link of ecommerceModuleProductsToAttributes.filter(
          (row) => row.productId === main.productId,
        )) {
          const isInterval = ecommerceModuleAttributesKeysToAttributes.some(
            (row) =>
              row.attributeId === link.attributeId &&
              intervalKeyIds.has(row.attributeKeyId),
          );
          if (isInterval) {
            const value = ecommerceModuleAttributes.find(
              (row) => row.id === link.attributeId,
            );
            const term = value?.string?.en ?? value?.string?.ru;
            if (term) {
              intervalValues.add(term);
            }
          }
        }
        interval = order.subscriptionSourceInterval ?? [...intervalValues][0];
        if (
          !interval ||
          (!order.subscriptionSourceInterval && intervalValues.size !== 1) ||
          !isSupportedOrderInterval(interval)
        ) {
          throw new Error(
            "Validation error. Subscription interval is missing or unsupported",
          );
        }
      }
      checkoutAttributesByOrderId.set(order.id, {
        amount: parseExactMonetaryAmount(quote.amount),
        type,
        interval,
      });
      if (
        type === "subscription" &&
        !this.billingModule.paymentIntent.schedulesSubscriptionPayments({
          provider: props.provider,
        }) &&
        (primaryProduct?.kind === "physical" ||
          quote.charges.some(
            (charge) =>
              charge.stockQuantity !== null || charge.recurrence === "first",
          ) ||
          order.subscriptionSourceOrderId)
      ) {
        separatePeriodOrderIds.add(order.id);
      }
      orderQuotes.set(order.id, { input, quote });
    }
    const pendingReservations = new Map<string, IReservationLine[]>();
    const checkoutStoreIds = [
      ...new Set(
        [...orderQuotes.values()].flatMap(({ quote }) =>
          quote.charges.flatMap((charge) => [
            charge.storeId,
            charge.providerStoreId,
          ]),
        ),
      ),
    ];
    const checkoutStores = checkoutStoreIds.length
      ? await this.ecommerceModule.store.find({
          params: {
            filters: {
              and: [
                { column: "id", method: "inArray", value: checkoutStoreIds },
              ],
            },
          },
        })
      : [];
    const storeTitle = (id: string) => {
      const store = checkoutStores.find((entry) => entry.id === id);
      return store?.title?.en ?? store?.title?.ru ?? store?.adminTitle ?? id;
    };
    const createPaymentLinks = async (
      orderId: string,
      paymentIntentId: string,
    ) => {
      const selected = orderQuotes.get(orderId);
      if (!selected) {
        await this.ecommerceModule.ordersToBillingModulePaymentIntents.create({
          data: { orderId, billingModulePaymentIntentId: paymentIntentId },
        });
        return;
      }
      const lines = ordersToProducts.filter((line) => line.orderId === orderId);
      const reservations: IReservationLine[] = selected.quote.charges.map(
        (charge) => {
          const line =
            lines.find((entry) => entry.id === charge.lineId) ??
            lines.find(
              (entry) =>
                entry.offerId === charge.offerId &&
                (charge.role === "product"
                  ? !entry.parentLineId
                  : Boolean(entry.parentLineId)),
            );
          if (!line) {
            throw new Error(
              "Validation error. Quoted charge has no selected order line",
            );
          }
          const product = ecommerceModuleProducts.find(
            (entry) => entry.id === charge.productId,
          );
          const title =
            product?.title?.en ??
            product?.title?.ru ??
            product?.adminTitle ??
            charge.productId;
          return {
            orderId,
            orderLineId: line.id,
            offerId: charge.offerId,
            quantity: charge.quantity,
            snapshot: {
              version: 1,
              currencyId: selected.input.currencyId,
              amount: charge.amount,
              orderAmount: selected.quote.amount!,
              purchaseType: checkoutAttributesByOrderId.get(orderId)!.type as
                "one_off" | "subscription",
              interval: checkoutAttributesByOrderId.get(orderId)!.interval,
              parentLineId: line.parentLineId ?? null,
              quoteVersion: selected.quote.version,
              quoteExpiresAt: selected.quote.expiresAt,
              charge: {
                ...charge,
                title,
                storeTitle: storeTitle(charge.storeId),
                providerStoreTitle: storeTitle(charge.providerStoreId),
              },
              destination:
                selected.quote.destination ?? selected.input.destination ?? {},
            },
          };
        },
      );
      pendingReservations.set(paymentIntentId, [
        ...(pendingReservations.get(paymentIntentId) ?? []),
        ...reservations,
      ]);
      const metadataOrder = metadata.ecommerceModule.orders.find(
        (entry: { id: string }) => entry.id === orderId,
      );
      if (metadataOrder) {
        metadataOrder.purchaseCharges = reservations.map((entry) => ({
          title: entry.snapshot.charge.title,
          amount: entry.snapshot.amount,
          quantity: entry.quantity,
          role: entry.snapshot.charge.role,
        }));
      }
    };
    const billingModulePaymentIntents: {
      orderIds: string[];
      billingModulePaymentIntent: IBillingModulePaymentIntent;
      billingModuleCurrencyId: string;
      checkoutAttributesByCurrency: {
        type: string;
        interval?: string;
      };
    }[] = [];
    // Claim and prepare locally so a pre-provider failure rolls back the cart.
    const claim = await this.dependencies.repository.withSubjectLock(
      { subjectId: props.id },
      async () => {
        const claim = await new CheckoutClaim({
          repository: this.dependencies.repository,
          ecommerceModule: this.ecommerceModule,
          billingModule: this.billingModule,
          subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
          settledOrderIds: this.dependencies.settledOrderIds,
        }).execute({
          subjectId: props.id,
          orderIds: ecommerceModuleOrders.map((order) => order.id),
          comment: props.comment,
          resumeExisting: true,
          expectedLines: ordersToProducts,
          expectedCurrencies: ordersToBillingModuleCurrencies,
        });
        if (claim.invoices) {
          return claim;
        }
        if (orderQuotes.size) {
          await this.ecommerceModule.ordersToBillingModulePaymentIntents.lockOffers(
            {
              offerIds: [...orderQuotes.values()].flatMap(({ quote }) =>
                quote.charges.map((charge) => charge.offerId),
              ),
            },
          );
          const selections = [...orderQuotes.entries()];
          const refreshed =
            await this.ecommerceModule.storesToProducts.quotesUnderLock(
              selections.map(([, selected]) => selected.input),
              selections.map(([, selected]) => selected.quote),
              quoteOptions,
            );
          if (refreshed.length !== selections.length) {
            throw new Error(
              "Configuration error. Locked checkout quote batch is incomplete",
            );
          }
          for (const [index, [orderId, selected]] of selections.entries()) {
            const fresh = refreshed[index];
            if (
              fresh.amount === null ||
              fresh.issues.length ||
              fresh.version !== selected.quote.version
            ) {
              throw new Error(
                `Conflict error. Checkout quote changed: ${JSON.stringify({ orderId, amount: fresh.amount, currencyId: fresh.currencyId, issues: fresh.issues, version: fresh.version, expiresAt: fresh.expiresAt })}`,
              );
            }
            selected.quote = fresh;
          }
        }

        for (const order of ecommerceModuleOrders) {
          const checkoutOrderProductIds = new Set(
            ordersToProducts
              .filter((orderToProduct) => {
                return (
                  orderToProduct.orderId === order["id"] &&
                  !orderToProduct.parentLineId
                );
              })
              .map((orderToProduct) => {
                return orderToProduct.productId;
              })
              .filter((productId): productId is string => Boolean(productId)),
          );

          if (!checkoutOrderProductIds.size) {
            throw new Error(
              "Not Found error. No checkout products found for order: " +
                order["id"],
            );
          }

          const billingModuleCurrencyId = ordersToBillingModuleCurrencies.find(
            (orderToBillingModuleCurrency) =>
              orderToBillingModuleCurrency.orderId === order["id"],
          )?.billingModuleCurrencyId;

          if (!billingModuleCurrencyId) {
            throw new Error(
              "Not Found error. No billing module currency id found for order: " +
                order["id"],
            );
          }

          const { amount, type, interval } = checkoutAttributesByOrderId.get(
            order.id,
          )!;

          if (type === "subscription") {
            const sourceOrderIds = new Set<string>();
            let sourceOrderId = order.subscriptionSourceOrderId;
            while (sourceOrderId) {
              if (sourceOrderIds.has(sourceOrderId)) {
                throw new Error(
                  "Conflict error. Subscription period chain is cyclic",
                );
              }
              sourceOrderIds.add(sourceOrderId);
              const source = await this.ecommerceModule.order.findById({
                id: sourceOrderId,
              });
              if (!source) {
                throw new Error(
                  "Conflict error. Subscription period source is unavailable",
                );
              }
              sourceOrderId = source.subscriptionSourceOrderId;
            }
            const subjectToEcommerceModuleOrders =
              await this.subjectsToEcommerceModuleOrders.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: props.id,
                      },
                    ],
                  },
                },
              });

            if (subjectToEcommerceModuleOrders?.length) {
              for (const subjectToEcommerceModuleOrder of subjectToEcommerceModuleOrders) {
                const ecommerceModuleOrder =
                  await this.ecommerceModule.order.findById({
                    id: subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
                  });

                if (!ecommerceModuleOrder) {
                  continue;
                }

                if (
                  ecommerceModuleOrders
                    .map((order) => order.id)
                    .includes(ecommerceModuleOrder.id)
                ) {
                  continue;
                }
                if (sourceOrderIds.has(ecommerceModuleOrder.id)) {
                  continue;
                }

                if (
                  !ACTIVE_SUBSCRIPTION_ORDER_STATUSES.includes(
                    ecommerceModuleOrder.status,
                  )
                ) {
                  continue;
                }

                if (
                  ecommerceModuleOrder.status === "paying" &&
                  !ecommerceModuleOrder.subscriptionPeriodInvoiceId &&
                  !ecommerceModuleOrder.subscriptionPeriodStartsAt &&
                  !ecommerceModuleOrder.subscriptionPeriodEndsAt
                ) {
                  const settled = await this.dependencies.settledOrderIds({
                    orderIds: [ecommerceModuleOrder.id],
                  });
                  if (!settled.has(ecommerceModuleOrder.id)) {
                    continue;
                  }
                }

                const ecommerceModuleOrderCheckoutAttributes =
                  await this.ecommerceModule.order.findByIdCheckoutAttributes({
                    id: ecommerceModuleOrder.id,
                  });

                if (
                  ecommerceModuleOrderCheckoutAttributes.type !== "subscription"
                ) {
                  continue;
                }

                const existingOrdersToProducts =
                  await this.ecommerceModule.ordersToProducts.find({
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
                            method: "eq",
                            value: ecommerceModuleOrder.id,
                          },
                        ],
                      },
                    },
                  });

                if (
                  existingOrdersToProducts?.some((orderToProduct) => {
                    return (
                      !orderToProduct.parentLineId &&
                      checkoutOrderProductIds.has(orderToProduct.productId)
                    );
                  })
                ) {
                  throw new Error(
                    "Validation error. Checking out order has active subscription products.",
                  );
                }
              }
            }
          }

          const existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes =
            billingModulePaymentIntents.find(
              (billingModulePaymentIntent) =>
                type !== "subscription" &&
                billingModulePaymentIntent.billingModuleCurrencyId ===
                  billingModuleCurrencyId &&
                billingModulePaymentIntent.checkoutAttributesByCurrency.type ===
                  type &&
                billingModulePaymentIntent.checkoutAttributesByCurrency
                  .interval === interval,
            );

          if (
            existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
          ) {
            const updatedBillingModulePaymentIntent =
              await this.billingModule.paymentIntent.update({
                id: existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
                  .billingModulePaymentIntent.id,
                data: {
                  ...existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes.billingModulePaymentIntent,
                  amount: addMoney(
                    amount,
                    existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
                      .billingModulePaymentIntent.amount,
                  ),
                },
              });

            billingModulePaymentIntents.splice(
              billingModulePaymentIntents.indexOf(
                existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes,
              ),
              1,
            );

            billingModulePaymentIntents.push({
              orderIds: [
                ...existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes.orderIds,
                order.id,
              ],
              billingModulePaymentIntent: updatedBillingModulePaymentIntent,
              billingModuleCurrencyId,
              checkoutAttributesByCurrency: {
                type,
                interval,
              },
            });

            await createPaymentLinks(
              order.id,
              updatedBillingModulePaymentIntent.id,
            );

            continue;
          }

          const billingModulePaymentIntent =
            await this.billingModule.paymentIntent.create({
              data: {
                amount,
                interval,
                type:
                  (separatePeriodOrderIds.has(order.id) ||
                    internal?.manualSubscriptionPeriod) &&
                  type === "subscription"
                    ? "one_off"
                    : type,
              },
            });

          billingModulePaymentIntents.push({
            orderIds: [order.id],
            billingModulePaymentIntent,
            billingModuleCurrencyId,
            checkoutAttributesByCurrency: {
              type,
              interval,
            },
          });

          await createPaymentLinks(order.id, billingModulePaymentIntent.id);
        }

        for (const [paymentIntentId, lines] of pendingReservations) {
          await this.ecommerceModule.ordersToBillingModulePaymentIntents.reserveCharges(
            { paymentIntentId, lines },
          );
        }
        for (const attempt of billingModulePaymentIntents) {
          await this.billingModule.paymentIntent.prepareCheckoutDispatch({
            id: attempt.billingModulePaymentIntent.id,
            provider: props.provider,
            currencyId: attempt.billingModuleCurrencyId,
            metadata: {
              ...metadata,
              ...(internal?.providerContractPaymentIntentId
                ? {
                    providerContractPaymentIntentId:
                      internal.providerContractPaymentIntentId,
                  }
                : {}),
              ...(this.billingModule.paymentIntent.schedulesSubscriptionPayments(
                {
                  provider: props.provider,
                },
              ) && attempt.checkoutAttributesByCurrency.type === "subscription"
                ? {
                    providerRecurringAmount: moneyFromMinorUnits(
                      attempt.orderIds.reduce((total, orderId) => {
                        const selected = orderQuotes.get(orderId);
                        if (!selected) {
                          return (
                            total +
                            moneyMinorUnits(
                              attempt.billingModulePaymentIntent.amount,
                            )
                          );
                        }
                        return (
                          total +
                          selected.quote.charges
                            .filter(
                              (charge) =>
                                charge.role === "product" ||
                                charge.recurrence === "each",
                            )
                            .reduce(
                              (sum, charge) =>
                                sum + moneyMinorUnits(charge.amount),
                              0n,
                            )
                        );
                      }, 0n),
                    ),
                  }
                : {}),
              ecommerceModule: {
                ...metadata.ecommerceModule,
                orders: metadata.ecommerceModule.orders.filter((order) =>
                  attempt.orderIds.includes(order.id),
                ),
              },
            },
          });
        }
        if (internal?.deferProviderCheckout) {
          for (const attempt of billingModulePaymentIntents) {
            await this.billingModule.paymentIntentsToCurrencies.create({
              data: {
                paymentIntentId: attempt.billingModulePaymentIntent.id,
                currencyId: attempt.billingModuleCurrencyId,
              },
            });
            const invoice = await this.billingModule.invoice.create({
              data: {
                provider: props.provider,
                status: "draft",
                amount: attempt.billingModulePaymentIntent.amount,
              },
            });
            await this.billingModule.paymentIntentsToInvoices.create({
              data: {
                paymentIntentId: attempt.billingModulePaymentIntent.id,
                invoiceId: invoice.id,
              },
            });
          }
        }
        return claim;
      },
    );
    if (internal?.deferProviderCheckout) {
      return { billingModule: { invoices: [] as IInvoice[] } };
    }
    const exposedPaymentIntentIds = new Set<string>();
    const preserveFailedCheckout = async (error: unknown): Promise<never> => {
      await Promise.allSettled(
        billingModulePaymentIntents.map(
          async ({ billingModulePaymentIntent }) => {
            if (exposedPaymentIntentIds.has(billingModulePaymentIntent.id)) {
              return;
            }
            const current = await this.billingModule.paymentIntent.findById({
              id: billingModulePaymentIntent.id,
            });
            if (
              current &&
              !["succeeded", "failed", "canceled"].includes(current.status)
            ) {
              await this.billingModule.paymentIntent.failUnpaidIntent(
                current.id,
                current.status,
              );
            }
          },
        ),
      );
      // Committed attempts stay in history; later cart changes must survive.
      throw error;
    };

    const settledFreeOrderIds = new Set(
      billingModulePaymentIntents
        .filter((attempt) => attempt.billingModulePaymentIntent.amount === 0)
        .flatMap((attempt) => attempt.orderIds),
    );
    await this.registerCheckoutObservers({
      orderIds: ecommerceModuleOrders.map((order) => order.id),
      subjectId: props.id,
      provider: claim.invoices?.[0]?.provider || props.provider,
      freeOrderIds: settledFreeOrderIds,
    }).catch(preserveFailedCheckout);

    if (claim.invoices) {
      return { billingModule: { invoices: claim.invoices } };
    }

    for (const billingModulePaymentIntent of billingModulePaymentIntents) {
      exposedPaymentIntentIds.add(
        billingModulePaymentIntent.billingModulePaymentIntent.id,
      );
      await billingModulePaymentIntentApi
        .provider({
          id: billingModulePaymentIntent.billingModulePaymentIntent.id,
          data: {
            provider: props.provider,
            metadata: {
              ...metadata,
              ecommerceModule: {
                ...metadata.ecommerceModule,
                orders: metadata.ecommerceModule.orders.filter(
                  (order: { id: string }) =>
                    billingModulePaymentIntent.orderIds.includes(order.id),
                ),
              },
            },
            currencyId: billingModulePaymentIntent.billingModuleCurrencyId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": rbacSecretKey,
            },
          },
        })
        .catch(preserveFailedCheckout);
    }

    for (const id of settledFreeOrderIds) {
      await ecommerceModuleOrderApi.check({
        id,
        data: {},
        options: { headers: { "X-RBAC-SECRET-KEY": rbacSecretKey } },
      });
    }

    const billingModulePaymentIntentsToInvoices =
      await this.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "inArray",
                value: billingModulePaymentIntents.map(
                  (billingModulePaymentIntent) =>
                    billingModulePaymentIntent.billingModulePaymentIntent.id,
                ),
              },
            ],
          },
        },
      });

    if (!billingModulePaymentIntentsToInvoices?.length) {
      throw new Error(
        "Not Found error. No billing-module payment intent to invoices found",
      );
    }

    const billingModuleInvoices = await this.billingModule.invoice.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: billingModulePaymentIntentsToInvoices.map(
                (item) => item.invoiceId,
              ),
            },
          ],
        },
      },
    });

    return {
      billingModule: {
        invoices: billingModuleInvoices,
      },
    };
  }
  private async resumePreparedCheckout(ids: string[]) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }
    for (const id of ids) {
      const intent = await this.billingModule.paymentIntent.findById({ id });
      if (
        !intent?.checkoutProvider ||
        !intent.checkoutCurrencyId ||
        !intent.checkoutMetadata
      ) {
        throw new Error(
          "Conflict error. Payment attempt has no trusted checkout context",
        );
      }
      await billingModulePaymentIntentApi.provider({
        id,
        data: {
          provider: intent.checkoutProvider,
          currencyId: intent.checkoutCurrencyId,
          metadata: intent.checkoutMetadata,
        },
        options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
      });
    }
  }

  private async existingAttemptInvoices(
    ids: string[],
    existingInvoices: IInvoice[] = [],
  ) {
    const links = await this.billingModule.paymentIntentsToInvoices.find({
      params: {
        filters: {
          and: [
            {
              column: "paymentIntentId",
              method: "inArray",
              value: [...new Set(ids)],
            },
          ],
        },
      },
    });
    const invoices = await this.billingModule.invoice.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: [...new Set(links.map((link) => link.invoiceId))],
            },
          ],
        },
      },
    });
    return {
      billingModule: {
        invoices: [
          ...new Map(
            [...existingInvoices, ...invoices].map((invoice) => [
              invoice.id,
              invoice,
            ]),
          ).values(),
        ],
      },
    };
  }

  private async registerCheckoutObservers(scope: {
    orderIds: string[];
    subjectId: string;
    provider: string;
    freeOrderIds?: Set<string>;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }
    const rbacSecretKey = RBAC_SECRET_KEY;
    for (const orderId of scope.orderIds) {
      if (!scope.freeOrderIds?.has(orderId)) {
        await broadcastModuleChannelApi.pushMessage({
          data: {
            slug: "observer",
            payload: JSON.stringify({
              expiresAt: new Date(
                Date.now() + 1000 * 60 * 60 * 24,
              ).toISOString(),
              trigger: {
                type: "request",
                method: "POST",
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/${scope.provider}/webhook`,
              },
              pipe: [
                {
                  type: "request",
                  method: "POST",
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${orderId}/check`,
                  headers: {
                    "X-RBAC-SECRET-KEY": rbacSecretKey,
                  },
                },
                {
                  type: "request",
                  method: "POST",
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${scope.subjectId}/check`,
                  headers: {
                    "X-RBAC-SECRET-KEY": rbacSecretKey,
                  },
                },
              ],
            }),
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": rbacSecretKey,
            },
          },
        });
      }

      const subjectCheckTriggers = [
        {
          method: "PATCH",
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${orderId}`,
        },
        {
          method: "POST",
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${orderId}/check`,
        },
      ];
      for (const trigger of subjectCheckTriggers) {
        await broadcastModuleChannelApi.pushMessage({
          data: {
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            slug: "observer",
            payload: JSON.stringify({
              trigger: { type: "request", ...trigger },
              pipe: [
                {
                  type: "request",
                  method: "POST",
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${scope.subjectId}/check`,
                  headers: {
                    "X-RBAC-SECRET-KEY": rbacSecretKey,
                  },
                },
              ],
            }),
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": rbacSecretKey,
            },
          },
        });
      }
    }
  }
}

import type { SubjectServiceDependencies } from "../index";
import { REGISTRATION_GRANT_VARIANT, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Service as InitialGrantProducts } from "./initial-grant-products";
import {
  consistencyContext,
  type FindServiceProps,
} from "@sps/shared-backend-api";
import { isSupportedOrderInterval } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes";
import type { IResult as IProduct } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service/singlepage/get-extended";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { Repository } from "../../../repository";
import type {
  IPaidFulfillmentEffect,
  Service as PaidFulfillment,
} from "../ecommerce/order/proceed";

export interface IExecuteProps {
  id: string;
  chatId?: string;
  email?: string;
}
export interface IConstructorProps {
  module: Pick<
    SubjectServiceDependencies["module"],
    "subjectsToEcommerceModuleOrders" | "subjectsToIdentities"
  >;
  modules: Pick<SubjectServiceDependencies["modules"], "billing" | "ecommerce">;
  repository: Pick<Repository, "withSubjectLock" | "lockOrderDelivery">;
  fulfillPaidOrderInTransaction: PaidFulfillment["fulfillPaidOrderInTransaction"];
  dispatchPaidEffects: PaidFulfillment["dispatchPaidEffects"];
}
interface IConfiguration {
  productId: string;
  storeId: string;
  currencyId: string;
  legacyHistory: boolean;
}

/** Trusted authentication bootstrap; never selected by a request payload. */
export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }
    if (!props.id) {
      throw new Error("Validation error. Subject is required");
    }
    if (consistencyContext.getStore()?.database) {
      throw new Error(
        "Configuration error. Initial Free bootstrap must own its outer transaction",
      );
    }
    const result = await this.dependencies.repository.withSubjectLock(
      { subjectId: props.id },
      async () => {
        const identities =
          await this.dependencies.module.subjectsToIdentities.find({
            params: {
              filters: {
                and: [{ column: "subjectId", method: "eq", value: props.id }],
              },
            },
          });
        if (!identities.some((link) => link.subjectId === props.id)) {
          throw new Error(
            "Permission error. Initial Free requires a registered Subject",
          );
        }
        const configurations = await this.configuration();
        const results: { invoice: IInvoice; effect: IPaidFulfillmentEffect }[] =
          [];
        const owned =
          await this.dependencies.module.subjectsToEcommerceModuleOrders.find({
            params: {
              filters: {
                and: [{ column: "subjectId", method: "eq", value: props.id }],
              },
            },
          });
        const orderIds = owned
          .filter((link) => link.subjectId === props.id)
          .map((link) => link.ecommerceModuleOrderId);
        for (const config of configurations) {
          let lines;
          if (orderIds.length) {
            lines =
              await this.dependencies.modules.ecommerce.ordersToProducts.find({
                params: {
                  filters: {
                    and: [
                      { column: "orderId", method: "inArray", value: orderIds },
                      {
                        column: "productId",
                        method: "eq",
                        value: config.productId,
                      },
                    ],
                  },
                },
              });
          } else {
            lines = [];
          }
          const previousIds = [
            ...new Set<string>(lines.map((line) => line.orderId)),
          ];
          const storeLinks = previousIds.length
            ? await this.dependencies.modules.ecommerce.storesToOrders.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "orderId",
                        method: "inArray",
                        value: previousIds,
                      },
                    ],
                  },
                },
              })
            : [];
          const storeOrderIds = new Set(storeLinks.map((link) => link.orderId));
          const issuingOrderIds = new Set(
            storeLinks
              .filter((link) => link.storeId === config.storeId)
              .map((link) => link.orderId),
          );
          const matchingOrders = await Promise.all(
            previousIds
              .filter((id) => issuingOrderIds.has(id) || !storeOrderIds.has(id))
              .map((id) =>
                this.dependencies.modules.ecommerce.order.findById({ id }),
              ),
          );
          if (matchingOrders.some((order) => !order)) {
            throw new Error(
              "Conflict error. Initial Free history is incomplete",
            );
          }
          const previous: NonNullable<(typeof matchingOrders)[number]>[] = [];
          for (const order of matchingOrders) {
            if (
              order &&
              (order.variant === REGISTRATION_GRANT_VARIANT ||
                (await this.isLegacyHistory(order, config)))
            ) {
              previous.push(order);
            }
          }
          if (
            previous.some(
              (order) =>
                order.subscriptionPeriodInvoiceId ||
                order.subscriptionRevokedAt ||
                [
                  "delivering",
                  "delivered",
                  "completed",
                  "expired",
                  "approving",
                  "packaging",
                  "canceled",
                  "canceling",
                  "requested_cancelation",
                ].includes(order.status),
            )
          ) {
            for (const order of previous) {
              if (!storeOrderIds.has(order.id)) {
                await this.dependencies.modules.ecommerce.storesToOrders.create(
                  {
                    data: { orderId: order.id, storeId: config.storeId },
                  },
                );
              }
              if (order.variant !== REGISTRATION_GRANT_VARIANT) {
                await this.dependencies.modules.ecommerce.order.update({
                  id: order.id,
                  data: { ...order, variant: REGISTRATION_GRANT_VARIANT },
                });
              }
            }
            continue;
          }
          if (
            previous.length > 1 ||
            previous.some(
              (order) =>
                !["new", "paying", "paid"].includes(order.status) ||
                order.subscriptionRevokedAt,
            )
          ) {
            throw new Error(
              "Conflict error. Initial Free history needs reconciliation",
            );
          }
          const order =
            previous[0] ??
            (await this.dependencies.modules.ecommerce.order.create({
              data: {
                type: "history",
                status: "paid",
                variant: REGISTRATION_GRANT_VARIANT,
              },
            }));
          await this.dependencies.repository.lockOrderDelivery({
            subjectId: props.id,
            orderId: order.id,
          });
          await this.dependencies.modules.ecommerce.order.lockForLifecycle({
            id: order.id,
          });
          await this.ensureOrderGraph(props.id, order.id, config);
          const invoice = await this.settleZeroInvoice(
            order.id,
            config.currencyId,
          );
          await this.dependencies.modules.ecommerce.order.update({
            id: order.id,
            data: {
              ...order,
              status: "paid",
              type: "history",
              variant: REGISTRATION_GRANT_VARIANT,
            },
          });
          const effect = await this.dependencies.fulfillPaidOrderInTransaction({
            subjectId: props.id,
            orderId: order.id,
          });
          if (!effect) {
            throw new Error(
              "Conflict error. Initial Free delivery was not accepted",
            );
          }
          results.push({ invoice, effect });
        }
        return results;
      },
    );
    if (!result.length) {
      return null;
    }
    for (const { effect } of result) {
      await this.dependencies.dispatchPaidEffects(effect);
    }
    return {
      billingModule: { invoices: result.map(({ invoice }) => invoice) },
    };
  }

  async activate(props: IExecuteProps) {
    return this.execute(props);
  }

  private async configuration(): Promise<IConfiguration[]> {
    const { ecommerce } = this.dependencies.modules;
    const offers = await new InitialGrantProducts(
      ecommerce.storesToProducts,
    ).find();
    const configurations = new Map<string, IConfiguration>();
    for (const offer of offers) {
      const key = `${offer.productId}:${offer.storeId}`;
      const configured = configurations.get(key);
      if (configured) {
        configured.legacyHistory ||=
          offer.settings?.initialGrantLegacyHistory === true;
        continue;
      }
      const [product, store]: [IProduct, unknown] = await Promise.all([
        ecommerce.product.findByIdExtended({ id: offer.productId }),
        ecommerce.store.findById({ id: offer.storeId }),
      ]);
      if (
        !product ||
        !store ||
        !["one_off", "subscription"].includes(product.type)
      ) {
        throw new Error(
          "Configuration error. Registration requires an existing Store and a supported Product",
        );
      }
      if (product.kind === "physical") {
        throw new Error(
          "Configuration error. Registration Products cannot require physical fulfillment",
        );
      }
      const attributes =
        product.productsToAttributes?.map((link) => link.attribute) ?? [];
      const typed = (type: string) =>
        attributes.filter((attribute) =>
          attribute.attributeKeysToAttribute?.some(
            (link) => link.attributeKey?.type === type,
          ),
        );
      const prices = typed("price");
      if (
        !prices.length ||
        prices.some(
          (attribute) =>
            !attribute.number?.trim() || Number(attribute.number) !== 0,
        )
      ) {
        throw new Error(
          "Configuration error. Registration Products must have only zero prices",
        );
      }
      if (
        prices.some(
          (price) =>
            !price.attributesToBillingModuleCurrencies?.length ||
            price.attributesToBillingModuleCurrencies.some(
              (link) => !link.billingModuleCurrency,
            ),
        )
      ) {
        throw new Error(
          "Configuration error. Registration prices require a Currency",
        );
      }
      const currencies = prices
        .flatMap(
          (attribute) => attribute.attributesToBillingModuleCurrencies ?? [],
        )
        .map((link) => link.billingModuleCurrency)
        .filter((currency): currency is NonNullable<typeof currency> =>
          Boolean(currency),
        );
      const unique = [
        ...new Map(
          currencies.map((currency) => [currency.id, currency]),
        ).values(),
      ];
      const defaults = unique.filter((currency) => currency.isDefault);
      let currency;
      if (unique.length === 1) {
        currency = unique[0];
      } else if (defaults.length === 1) {
        currency = defaults[0];
      }
      const intervals = typed("interval");
      if (
        !currency ||
        (product.type === "subscription" &&
          (intervals.length !== 1 ||
            !isSupportedOrderInterval(intervals[0].string?.en ?? "")))
      ) {
        throw new Error(
          "Configuration error. Registration requires a Currency and subscriptions require a valid interval",
        );
      }
      configurations.set(key, {
        productId: product.id,
        storeId: offer.storeId,
        currencyId: currency.id,
        legacyHistory: offer.settings?.initialGrantLegacyHistory === true,
      });
    }
    // Earlier grants can lack a Store link. Give their legacy issuer first
    // claim, preserving the association creation order within each group.
    return [...configurations.values()].sort(
      (left, right) => Number(right.legacyHistory) - Number(left.legacyHistory),
    );
  }

  private async ensureOrderGraph(
    subjectId: string,
    orderId: string,
    config: IConfiguration,
  ) {
    const { ecommerce } = this.dependencies.modules;
    const { subjectsToEcommerceModuleOrders } = this.dependencies.module;
    const filters: FindServiceProps = {
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    };
    const owners = await subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            { column: "ecommerceModuleOrderId", method: "eq", value: orderId },
          ],
        },
      },
    });
    if (
      owners.length > 1 ||
      owners.some((link) => link.subjectId !== subjectId)
    ) {
      throw new Error("Conflict error. Initial Free Order owner is ambiguous");
    }
    if (!owners.length) {
      await subjectsToEcommerceModuleOrders.create({
        data: { subjectId, ecommerceModuleOrderId: orderId },
      });
    }
    const lines = await ecommerce.ordersToProducts.find(filters);
    if (
      lines.length > 1 ||
      lines.some(
        (line) =>
          line.productId !== config.productId ||
          Number(line.quantity ?? 1) !== 1,
      )
    ) {
      throw new Error(
        "Conflict error. Initial Free Order has unrelated Products",
      );
    }
    if (!lines.length) {
      await ecommerce.ordersToProducts.create({
        data: {
          orderId,
          productId: config.productId,
          quantity: 1,
          variant: REGISTRATION_GRANT_VARIANT,
        },
      });
    }
    const stores = await ecommerce.storesToOrders.find(filters);
    if (
      stores.length > 1 ||
      stores.some((link) => link.storeId !== config.storeId)
    ) {
      throw new Error("Conflict error. Initial Free Store is ambiguous");
    }
    if (!stores.length) {
      await ecommerce.storesToOrders.create({
        data: { orderId, storeId: config.storeId },
      });
    }
    const currencies =
      await ecommerce.ordersToBillingModuleCurrencies.find(filters);
    if (
      currencies.length > 1 ||
      currencies.some(
        (link) => link.billingModuleCurrencyId !== config.currencyId,
      )
    ) {
      throw new Error("Conflict error. Initial Free Currency is ambiguous");
    }
    if (!currencies.length) {
      await ecommerce.ordersToBillingModuleCurrencies.create({
        data: { orderId, billingModuleCurrencyId: config.currencyId },
      });
    }
  }

  private async isLegacyHistory(
    order: {
      id: string;
      type: string;
      status: string;
      subscriptionPeriodInvoiceId?: string | null;
    },
    config: IConfiguration,
  ): Promise<boolean> {
    if (!config.legacyHistory || order.type !== "history") {
      return false;
    }
    const { ecommerce, billing } = this.dependencies.modules;
    const filters: FindServiceProps = {
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: order.id }],
        },
      },
    };
    const [lines, stores, currencies, links] = await Promise.all([
      ecommerce.ordersToProducts.find(filters),
      ecommerce.storesToOrders.find(filters),
      ecommerce.ordersToBillingModuleCurrencies.find(filters),
      ecommerce.order.ordersToBillingModulePaymentIntents.find(filters),
    ]);
    if (
      lines.length !== 1 ||
      lines[0].productId !== config.productId ||
      Number(lines[0].quantity ?? 1) !== 1 ||
      lines[0].offerId ||
      lines[0].parentLineId ||
      stores.length > 1 ||
      stores.some((link) => link.storeId !== config.storeId) ||
      currencies.length > 1 ||
      currencies.some(
        (link) => link.billingModuleCurrencyId !== config.currencyId,
      )
    ) {
      return false;
    }
    const pending =
      !order.subscriptionPeriodInvoiceId &&
      ["new", "paying", "paid"].includes(order.status);
    if (!pending && (stores.length !== 1 || currencies.length !== 1)) {
      return false;
    }
    if (!links.length) {
      return pending;
    }
    if (links.length !== 1) {
      return false;
    }
    const intent = await ecommerce.order.paymentIntent.findById({
      id: links[0].billingModulePaymentIntentId,
    });
    if (
      !intent ||
      intent.amount !== 0 ||
      (!pending && intent.type !== "one_off")
    ) {
      return false;
    }
    const invoiceLinks = await billing.paymentIntentsToInvoices.find({
      params: {
        filters: {
          and: [{ column: "paymentIntentId", method: "eq", value: intent.id }],
        },
      },
    });
    if (!invoiceLinks.length) {
      return pending;
    }
    if (invoiceLinks.length !== 1) {
      return false;
    }
    const invoice = await billing.invoice.findById({
      id: invoiceLinks[0].invoiceId,
    });
    return Boolean(
      invoice &&
      invoice.amount === 0 &&
      ["dummy", "telegram-star"].includes(invoice.provider ?? ""),
    );
  }

  private async settleZeroInvoice(
    orderId: string,
    currencyId: string,
  ): Promise<IInvoice> {
    const { ecommerce, billing } = this.dependencies.modules;
    const orderLinks =
      await ecommerce.order.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    if (orderLinks.length > 1) {
      throw new Error(
        "Conflict error. Initial Free PaymentIntent is ambiguous",
      );
    }
    let intent;
    if (orderLinks.length) {
      intent = await ecommerce.order.paymentIntent.findById({
        id: orderLinks[0].billingModulePaymentIntentId,
      });
    } else {
      intent = undefined;
    }
    if (orderLinks.length && !intent) {
      throw new Error("Conflict error. Initial Free PaymentIntent is missing");
    }
    if (
      intent &&
      (intent.amount !== 0 ||
        ![
          "requires_payment_method",
          "requires_confirmation",
          "requires_action",
          "processing",
          "succeeded",
        ].includes(intent.status))
    ) {
      throw new Error(
        "Conflict error. Initial Free PaymentIntent cannot be settled",
      );
    }
    if (!intent) {
      intent = await ecommerce.order.paymentIntent.create({
        data: { amount: 0, status: "succeeded", type: "one_off" },
      });
      await ecommerce.order.ordersToBillingModulePaymentIntents.create({
        data: { orderId, billingModulePaymentIntentId: intent.id },
      });
    }
    const relatedOrders =
      await ecommerce.order.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "eq",
                value: intent.id,
              },
            ],
          },
        },
      });
    if (relatedOrders.length !== 1 || relatedOrders[0].orderId !== orderId) {
      throw new Error("Conflict error. Initial Free PaymentIntent is shared");
    }
    const intentFilter: FindServiceProps = {
      params: {
        filters: {
          and: [{ column: "paymentIntentId", method: "eq", value: intent.id }],
        },
      },
    };
    const currencies =
      await billing.paymentIntentsToCurrencies.find(intentFilter);
    if (
      currencies.length > 1 ||
      currencies.some((link) => link.currencyId !== currencyId)
    ) {
      throw new Error(
        "Conflict error. Initial Free PaymentIntent Currency is ambiguous",
      );
    }
    if (!currencies.length) {
      await billing.paymentIntentsToCurrencies.create({
        data: { paymentIntentId: intent.id, currencyId },
      });
    }
    const invoiceLinks =
      await billing.paymentIntentsToInvoices.find(intentFilter);
    if (invoiceLinks.length > 1) {
      throw new Error("Conflict error. Initial Free Invoice is ambiguous");
    }
    let invoice;
    if (invoiceLinks.length) {
      invoice = await billing.invoice.findById({
        id: invoiceLinks[0].invoiceId,
      });
    } else {
      invoice = undefined;
    }
    if (invoiceLinks.length && !invoice) {
      throw new Error("Conflict error. Initial Free Invoice is missing");
    }
    if (
      invoice &&
      (invoice.amount !== 0 ||
        !["draft", "open", "paid"].includes(invoice.status) ||
        !["dummy", "telegram-star"].includes(invoice.provider ?? ""))
    ) {
      throw new Error("Conflict error. Initial Free Invoice cannot be settled");
    }
    if (!invoice) {
      invoice = await billing.invoice.create({
        data: { amount: 0, status: "paid", provider: "dummy" },
      });
      await billing.paymentIntentsToInvoices.create({
        data: { paymentIntentId: intent.id, invoiceId: invoice.id },
      });
    }
    const relatedIntents = await billing.paymentIntentsToInvoices.find({
      params: {
        filters: {
          and: [{ column: "invoiceId", method: "eq", value: invoice.id }],
        },
      },
    });
    if (
      relatedIntents.length !== 1 ||
      relatedIntents[0].paymentIntentId !== intent.id
    ) {
      throw new Error("Conflict error. Initial Free Invoice is shared");
    }
    if (invoice.status !== "paid") {
      invoice = await billing.invoice.update({
        id: invoice.id,
        data: { ...invoice, status: "paid" },
      });
    }
    if (intent.status !== "succeeded" || intent.type !== "one_off") {
      await ecommerce.order.paymentIntent.update({
        id: intent.id,
        data: { ...intent, status: "succeeded", type: "one_off" },
      });
    }
    return invoice;
  }
}

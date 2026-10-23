import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { consistencyContext } from "@sps/shared-backend-api";
import { internationalization } from "@sps/shared-configuration";
import { isSupportedOrderInterval } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes";
import type { IResult as IProduct } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service/singlepage/get-extended";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { IBillingModule, IEcommerceModule } from "../../../di";
import type { Repository } from "../../../repository";
import type { Service as SubjectsToOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import type { Service as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import type { Service as PaidFulfillment } from "../ecommerce/order/proceed";

export interface IExecuteProps {
  id: string;
  chatId?: string;
  email?: string;
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock" | "lockOrderDelivery">;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: Pick<SubjectsToOrders, "find" | "create">;
  subjectsToIdentities: Pick<SubjectsToIdentities, "find">;
  fulfillPaidOrderInTransaction: PaidFulfillment["fulfillPaidOrderInTransaction"];
  dispatchPaidEffects: PaidFulfillment["dispatchPaidEffects"];
}
interface IConfiguration {
  productId: string;
  storeId: string;
  currencyId: string;
}

/** Trusted authentication bootstrap; never selected by a request payload. */
export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    if (!props.id) throw new Error("Validation error. Subject is required");
    if (consistencyContext.getStore()?.database)
      throw new Error(
        "Configuration error. Initial Free bootstrap must own its outer transaction",
      );
    const result = await this.dependencies.repository.withSubjectLock(
      { subjectId: props.id },
      async () => {
        const identities = await this.dependencies.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: props.id }],
            },
          },
        });
        if (!identities.some((link) => link.subjectId === props.id))
          throw new Error(
            "Permission error. Initial Free requires a registered Subject",
          );
        const config = await this.configuration();
        const owned =
          await this.dependencies.subjectsToEcommerceModuleOrders.find({
            params: {
              filters: {
                and: [{ column: "subjectId", method: "eq", value: props.id }],
              },
            },
          });
        const orderIds = owned
          .filter((link) => link.subjectId === props.id)
          .map((link) => link.ecommerceModuleOrderId);
        const lines = orderIds.length
          ? await this.dependencies.ecommerceModule.ordersToProducts.find({
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
            })
          : [];
        const previousIds = [
          ...new Set<string>(lines.map((line) => line.orderId)),
        ];
        const previous = await Promise.all(
          previousIds.map((id) =>
            this.dependencies.ecommerceModule.order.findById({ id }),
          ),
        );
        if (previous.some((order) => !order))
          throw new Error("Conflict error. Initial Free history is incomplete");
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
        )
          return null;
        if (
          previous.length > 1 ||
          previous.some(
            (order) =>
              !["new", "paying", "paid"].includes(order.status) ||
              order.subscriptionRevokedAt,
          )
        )
          throw new Error(
            "Conflict error. Initial Free history needs reconciliation",
          );
        const order =
          previous[0] ??
          (await this.dependencies.ecommerceModule.order.create({
            data: { type: "history", status: "paid" },
          }));
        await this.dependencies.repository.lockOrderDelivery({
          subjectId: props.id,
          orderId: order.id,
        });
        await this.dependencies.ecommerceModule.order.lockForLifecycle({
          id: order.id,
        });
        await this.ensureOrderGraph(props.id, order.id, config);
        const invoice = await this.settleZeroInvoice(
          order.id,
          config.currencyId,
        );
        await this.dependencies.ecommerceModule.order.update({
          id: order.id,
          data: { ...order, status: "paid", type: "history" },
        });
        const effect = await this.dependencies.fulfillPaidOrderInTransaction({
          subjectId: props.id,
          orderId: order.id,
        });
        if (!effect)
          throw new Error(
            "Conflict error. Initial Free delivery was not accepted",
          );
        return { invoice, effect };
      },
    );
    if (!result) return null;
    await this.dependencies.dispatchPaidEffects(result.effect);
    return { billingModule: { invoices: [result.invoice] } };
  }

  async activate(props: IExecuteProps) {
    return this.execute(props);
  }

  private async configuration(): Promise<IConfiguration> {
    const { ecommerceModule } = this.dependencies;
    const products = await ecommerceModule.product.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
            },
            { column: "type", method: "eq", value: "subscription" },
          ],
        },
      },
    });
    if (
      products.length !== 1 ||
      products[0].slug !== INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG ||
      products[0].type !== "subscription"
    )
      throw new Error(
        "Configuration error. Configure the exact internal Free subscription Product",
      );
    const product: IProduct = await ecommerceModule.product.findByIdExtended({
      id: products[0].id,
    });
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
    )
      throw new Error(
        "Configuration error. Initial Free must have only zero prices",
      );
    const currencies = prices
      .flatMap(
        (attribute) => attribute.attributesToBillingModuleCurrencies ?? [],
      )
      .map((link) => link.billingModuleCurrency)
      .filter((currency) => !!currency);
    const unique = [
      ...new Map(
        currencies.map((currency) => [currency.id, currency]),
      ).values(),
    ];
    const defaultCurrencies = unique.filter((currency) => currency.isDefault);
    const currency =
      unique.length === 1
        ? unique[0]
        : defaultCurrencies.length === 1
          ? defaultCurrencies[0]
          : undefined;
    const intervals = typed("interval");
    if (
      !currency ||
      intervals.length !== 1 ||
      !isSupportedOrderInterval(
        intervals[0].string?.[internationalization.defaultLanguage.code] ?? "",
      )
    )
      throw new Error(
        "Configuration error. Initial Free requires a Currency and a valid interval",
      );
    const topups = typed("topup");
    const topupLinks = topups.flatMap(
      (attribute) => attribute.attributesToBillingModuleCurrencies ?? [],
    );
    if (
      topups.length !== 1 ||
      Number(topups[0].number) !== 3000 ||
      topupLinks.length !== 1 ||
      topupLinks[0].billingModuleCurrency?.slug !== "token"
    )
      throw new Error(
        "Configuration error. Initial Free requires exactly 3000 Token credits",
      );
    const stores = await ecommerceModule.store.find();
    if (stores.length !== 1)
      throw new Error(
        "Configuration error. Initial Free requires exactly one Store",
      );
    return {
      productId: product.id,
      currencyId: currency.id,
      storeId: stores[0].id,
    };
  }

  private async ensureOrderGraph(
    subjectId: string,
    orderId: string,
    config: IConfiguration,
  ) {
    const { ecommerceModule, subjectsToEcommerceModuleOrders } =
      this.dependencies;
    const filters = {
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
    )
      throw new Error("Conflict error. Initial Free Order owner is ambiguous");
    if (!owners.length)
      await subjectsToEcommerceModuleOrders.create({
        data: { subjectId, ecommerceModuleOrderId: orderId },
      });
    const lines = await ecommerceModule.ordersToProducts.find(filters);
    if (
      lines.length > 1 ||
      lines.some(
        (line) =>
          line.productId !== config.productId ||
          Number(line.quantity ?? 1) !== 1,
      )
    )
      throw new Error(
        "Conflict error. Initial Free Order has unrelated Products",
      );
    if (!lines.length)
      await ecommerceModule.ordersToProducts.create({
        data: { orderId, productId: config.productId, quantity: 1 },
      });
    const stores = await ecommerceModule.storesToOrders.find(filters);
    if (
      stores.length > 1 ||
      stores.some((link) => link.storeId !== config.storeId)
    )
      throw new Error("Conflict error. Initial Free Store is ambiguous");
    if (!stores.length)
      await ecommerceModule.storesToOrders.create({
        data: { orderId, storeId: config.storeId },
      });
    const currencies =
      await ecommerceModule.ordersToBillingModuleCurrencies.find(filters);
    if (
      currencies.length > 1 ||
      currencies.some(
        (link) => link.billingModuleCurrencyId !== config.currencyId,
      )
    )
      throw new Error("Conflict error. Initial Free Currency is ambiguous");
    if (!currencies.length)
      await ecommerceModule.ordersToBillingModuleCurrencies.create({
        data: { orderId, billingModuleCurrencyId: config.currencyId },
      });
  }

  private async settleZeroInvoice(
    orderId: string,
    currencyId: string,
  ): Promise<IInvoice> {
    const { ecommerceModule, billingModule } = this.dependencies;
    const orderLinks =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    if (orderLinks.length > 1)
      throw new Error(
        "Conflict error. Initial Free PaymentIntent is ambiguous",
      );
    let intent = orderLinks.length
      ? await billingModule.paymentIntent.findById({
          id: orderLinks[0].billingModulePaymentIntentId,
        })
      : undefined;
    if (orderLinks.length && !intent)
      throw new Error("Conflict error. Initial Free PaymentIntent is missing");
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
    )
      throw new Error(
        "Conflict error. Initial Free PaymentIntent cannot be settled",
      );
    if (!intent) {
      intent = await billingModule.paymentIntent.create({
        data: { amount: 0, status: "succeeded", type: "one_off" },
      });
      await ecommerceModule.ordersToBillingModulePaymentIntents.create({
        data: { orderId, billingModulePaymentIntentId: intent.id },
      });
    }
    const relatedOrders =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find({
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
    if (relatedOrders.length !== 1 || relatedOrders[0].orderId !== orderId)
      throw new Error("Conflict error. Initial Free PaymentIntent is shared");
    const intentFilter = {
      params: {
        filters: {
          and: [{ column: "paymentIntentId", method: "eq", value: intent.id }],
        },
      },
    };
    const currencies =
      await billingModule.paymentIntentsToCurrencies.find(intentFilter);
    if (
      currencies.length > 1 ||
      currencies.some((link) => link.currencyId !== currencyId)
    )
      throw new Error(
        "Conflict error. Initial Free PaymentIntent Currency is ambiguous",
      );
    if (!currencies.length)
      await billingModule.paymentIntentsToCurrencies.create({
        data: { paymentIntentId: intent.id, currencyId },
      });
    const invoiceLinks =
      await billingModule.paymentIntentsToInvoices.find(intentFilter);
    if (invoiceLinks.length > 1)
      throw new Error("Conflict error. Initial Free Invoice is ambiguous");
    let invoice = invoiceLinks.length
      ? await billingModule.invoice.findById({ id: invoiceLinks[0].invoiceId })
      : undefined;
    if (invoiceLinks.length && !invoice)
      throw new Error("Conflict error. Initial Free Invoice is missing");
    if (
      invoice &&
      (invoice.amount !== 0 ||
        !["draft", "open", "paid"].includes(invoice.status) ||
        !["dummy", "telegram-star"].includes(invoice.provider ?? ""))
    )
      throw new Error("Conflict error. Initial Free Invoice cannot be settled");
    if (!invoice) {
      invoice = await billingModule.invoice.create({
        data: { amount: 0, status: "paid", provider: "dummy" },
      });
      await billingModule.paymentIntentsToInvoices.create({
        data: { paymentIntentId: intent.id, invoiceId: invoice.id },
      });
    }
    const relatedIntents = await billingModule.paymentIntentsToInvoices.find({
      params: {
        filters: {
          and: [{ column: "invoiceId", method: "eq", value: invoice.id }],
        },
      },
    });
    if (
      relatedIntents.length !== 1 ||
      relatedIntents[0].paymentIntentId !== intent.id
    )
      throw new Error("Conflict error. Initial Free Invoice is shared");
    if (invoice.status !== "paid")
      invoice = await billingModule.invoice.update({
        id: invoice.id,
        data: { ...invoice, status: "paid" },
      });
    if (intent.status !== "succeeded" || intent.type !== "one_off")
      await billingModule.paymentIntent.update({
        id: intent.id,
        data: { ...intent, status: "succeeded", type: "one_off" },
      });
    return invoice;
  }
}

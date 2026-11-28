import { z } from "zod";
import { currencyPrecision } from "@sps/shared-utils";
import type { IModel as ICurrency } from "@sps/billing/models/currency/sdk/model";
import { moneyFromMinorUnits, moneyMinorUnits } from "@sps/backend-utils";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { ICustomerOrderMoney } from "@sps/rbac/models/subject/sdk/model";
import type { SubjectServiceDependencies } from "../../../index";
import { inIds } from "../../customer-work/utils";

const attribute = z.object({
  number: z.union([z.string(), z.number()]).nullish(),
  attributesKeysToAttributes: z
    .array(
      z.object({
        attributeKey: z.object({ type: z.string() }).nullish(),
      }),
    )
    .default([]),
  attributesToBillingModuleCurrencies: z
    .array(z.object({ billingModuleCurrencyId: z.string() }))
    .default([]),
});
const savedProduct = z.object({
  id: z.string(),
  title: z.record(z.string(), z.string()).nullish(),
  productsToAttributes: z
    .array(z.object({ attributes: z.array(attribute) }))
    .optional(),
});
const savedLine = z.object({
  id: z.string(),
  productId: z.string(),
  orderId: z.string(),
  quantity: z.number().int().positive(),
  offerId: z.string().nullish(),
  destination: z
    .object({
      address: z.string().optional(),
      region: z.string().optional(),
      pickupPointId: z.string().optional(),
    })
    .nullish(),
  products: z.array(savedProduct).optional(),
});
const metadata = z.object({
  email: z.string().email().optional().catch(undefined),
  ecommerceModule: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
        ordersToProducts: z.array(savedLine).optional().catch(undefined),
      }),
    ),
  }),
});

type TSavedCheckout = z.infer<typeof metadata>;
export interface IOrderPayment {
  amount: number;
  provider?: string;
  links: IPaymentLink[];
  currencyId?: string;
  singleOrder: boolean;
  saved?: TSavedCheckout["ecommerceModule"]["orders"][number];
  email?: string;
}

export class Service {
  constructor(private readonly subject: SubjectServiceDependencies) {}

  async payments(orderIds: string[], subjectId: string, selectedId?: string) {
    const { ecommerce, billing } = this.subject.modules;
    const links =
      await ecommerce.order.ordersToBillingModulePaymentIntents.find(
        inIds("orderId", orderIds),
      );
    const result = new Map<string, IOrderPayment>();
    const ids = [
      ...new Set(links.map((link) => link.billingModulePaymentIntentId)),
    ];
    if (!ids.length) {
      return result;
    }
    const [intents, allLinks, currencies] = await Promise.all([
      ecommerce.order.paymentIntent.find(inIds("id", ids)),
      ecommerce.order.ordersToBillingModulePaymentIntents.find(
        inIds("billingModulePaymentIntentId", ids),
      ),
      billing.paymentIntentsToCurrencies.find(inIds("paymentIntentId", ids)),
    ]);
    // A successful attempt remains authoritative after a newer failed retry.
    intents.sort(
      (a, b) =>
        Number(b.status === "succeeded") - Number(a.status === "succeeded") ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.id.localeCompare(a.id),
    );
    for (const intent of intents) {
      const related = allLinks.filter(
        (link) => link.billingModulePaymentIntentId === intent.id,
      );
      const relatedIds = new Set(related.map((link) => link.orderId));
      const parsed = metadata.safeParse(intent.checkoutMetadata);
      const saved = parsed.data?.ecommerceModule.orders;
      for (const orderId of relatedIds) {
        if (result.has(orderId) || !orderIds.includes(orderId)) {
          continue;
        }
        const payment: IOrderPayment = {
          amount: intent.amount,
          provider: intent.checkoutProvider ?? undefined,
          links: related.filter((link) => link.orderId === orderId),
          singleOrder:
            relatedIds.size === 1 &&
            saved?.length === 1 &&
            saved[0].id === orderId,
          saved: saved?.find((order) => order.id === orderId),
          currencyId:
            intent.checkoutCurrencyId ??
            currencies.find((link) => link.paymentIntentId === intent.id)
              ?.currencyId,
        };
        if (
          orderId === selectedId &&
          parsed.data?.email &&
          payment.saved &&
          saved?.every((order) => relatedIds.has(order.id))
        ) {
          const owners =
            await this.subject.module.subjectsToEcommerceModuleOrders.find(
              inIds("ecommerceModuleOrderId", relatedIds),
            );
          const owned = new Set(
            owners
              .filter((link) => link.subjectId === subjectId)
              .map((link) => link.ecommerceModuleOrderId),
          );
          if (
            owners.every((link) => link.subjectId === subjectId) &&
            [...relatedIds].every((id) => owned.has(id))
          ) {
            payment.email = parsed.data.email;
          }
        }
        if (orderId === selectedId && !payment.provider) {
          const invoiceLinks = await billing.paymentIntentsToInvoices.find(
            inIds("paymentIntentId", [intent.id]),
          );
          if (invoiceLinks.length) {
            const invoices = await billing.invoice.find(
              inIds(
                "id",
                invoiceLinks.map((link) => link.invoiceId),
              ),
            );
            const providers = new Set(
              invoices
                .map((invoice) => invoice.provider)
                .filter((provider): provider is string => !!provider),
            );
            if (providers.size === 1) {
              payment.provider = [...providers][0];
            }
          }
        }
        result.set(orderId, payment);
      }
    }
    return result;
  }

  money(
    amount: number | string | null | undefined,
    currency?: ICurrency,
  ): ICustomerOrderMoney | undefined {
    if (
      amount === null ||
      amount === undefined ||
      amount === "" ||
      !currency ||
      !Number.isFinite(Number(amount))
    ) {
      return;
    }
    return {
      amount: Number(amount),
      symbol: currency.symbol,
      precision: currencyPrecision(currency),
    };
  }

  savedLinePrice(
    line: NonNullable<
      NonNullable<IOrderPayment["saved"]>["ordersToProducts"]
    >[number],
    currency: ICurrency,
  ) {
    // Offer-backed checkouts use their saved quote, including quantity tiers and formulas.
    if (line.offerId) {
      return;
    }
    const product = line.products?.find(
      (product) => product.id === line.productId,
    );
    const prices = product?.productsToAttributes?.flatMap((link) =>
      link.attributes.filter(
        (attribute) =>
          attribute.attributesKeysToAttributes.some(
            (key) => key.attributeKey?.type === "price",
          ) &&
          attribute.attributesToBillingModuleCurrencies[0]
            ?.billingModuleCurrencyId === currency.id,
      ),
    );
    if (prices?.length !== 1 || prices[0].number == null) {
      return;
    }
    try {
      const amount = moneyMinorUnits(prices[0].number) * BigInt(line.quantity);
      return this.money(moneyFromMinorUnits(amount), currency);
    } catch {
      return;
    }
  }
}

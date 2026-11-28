import {
  deliveredOrderWorkFile,
  type IStoreOrderRow,
} from "@sps/ecommerce/models/order/sdk/model";
import { currencyPrecision } from "@sps/shared-utils";
import { Service as OrderSummary } from "../../ecommerce/customer-work/order-summary";
import { moneyFromMinorUnits, moneyMinorUnits } from "@sps/backend-utils";
import { isConfirmedInvoice } from "@sps/billing/models/payment-intent/sdk/model";
import type { ICrmOrderContents } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { Service as Subject } from "../../index";
import { criteria, inIds } from "../../ecommerce/customer-work/utils";

export class Service {
  constructor(private readonly subject: Subject) {}

  private async storeLines(storeId: string, orderIds: string[]) {
    const { ecommerce } = this.subject.modules;
    const [stores, lines] = await Promise.all([
      ecommerce.storesToOrders.find(inIds("orderId", orderIds)),
      ecommerce.ordersToProducts.find(inIds("orderId", orderIds)),
    ]);
    const offerIds = lines.flatMap((line) =>
      line.offerId ? [line.offerId] : [],
    );
    const offers = offerIds.length
      ? await ecommerce.storesToProducts.find(inIds("id", offerIds))
      : [];
    const ownOffers = new Set(
      offers
        .filter((offer) => offer.storeId === storeId)
        .map((offer) => offer.id),
    );
    const scopes = orderIds.map((id) => {
      const memberships = stores.filter((link) => link.orderId === id);
      const orderLines = lines.filter((line) => line.orderId === id);
      const exclusive =
        memberships.some((link) => link.storeId === storeId) &&
        memberships.every((link) => link.storeId === storeId) &&
        orderLines.every(
          (line) => !line.offerId || ownOffers.has(line.offerId),
        );
      const ownLines = orderLines
        .filter((line) =>
          line.offerId ? ownOffers.has(line.offerId) : exclusive,
        )
        .sort(
          (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
        );
      return { id, exclusive, ownLines };
    });
    const productIds = scopes.flatMap((scope) =>
      scope.ownLines.map((line) => line.productId),
    );
    const products = productIds.length
      ? await ecommerce.product.find(inIds("id", productIds))
      : [];
    return {
      scopes,
      products: new Map(products.map((product) => [product.id, product])),
    };
  }

  async summaries(
    storeId: string,
    orders: { id: string; type: string }[],
    canReadCosts: boolean,
  ) {
    const summaries = new Map<
      string,
      Pick<IStoreOrderRow, "items" | "total">
    >();
    if (!orders.length) {
      return summaries;
    }
    const ids = orders.map((order) => order.id);
    const { scopes, products } = await this.storeLines(storeId, ids);
    const sharedIds = scopes
      .filter((scope) => !scope.exclusive)
      .map((scope) => scope.id);
    const { ecommerce, billing } = this.subject.modules;
    const links =
      canReadCosts && sharedIds.length
        ? await ecommerce.ordersToBillingModulePaymentIntents.find(
            inIds("orderId", sharedIds),
          )
        : [];
    const charges = links.flatMap((link) =>
      link.orderLineId && link.purchaseSnapshot?.charge.storeId === storeId
        ? [
            {
              orderId: link.orderId,
              lineId: link.orderLineId,
              snapshot: link.purchaseSnapshot,
            },
          ]
        : [],
    );
    const currencyIds = charges.map(({ snapshot }) => snapshot.currencyId);
    const currencies = currencyIds.length
      ? await billing.currency.find(inIds("id", currencyIds))
      : [];
    const totals = new OrderSummary(this.subject);
    await Promise.all(
      scopes.map(async ({ id, exclusive, ownLines }, index) => {
        const items = ownLines.map((line) => {
          const product = products.get(line.productId);
          return {
            id: line.id,
            quantity: line.quantity,
            product: {
              id: line.productId,
              title: product?.title ?? null,
              name: product?.adminTitle || product?.slug || line.productId,
            },
          };
        });
        if (!canReadCosts) {
          summaries.set(id, { items });
          return;
        }
        if (exclusive) {
          const total = await totals.total(id, orders[index].type);
          summaries.set(id, { items, total: total ?? null });
          return;
        }
        // A shared checkout may include other stores. Count each local line once across payment attempts.
        const byLine = ownLines.map((line) =>
          charges
            .filter(
              (charge) => charge.orderId === id && charge.lineId === line.id,
            )
            .map((charge) => charge.snapshot),
        );
        const currency = currencies.find(
          (currency) => currency.id === byLine[0]?.[0]?.currencyId,
        );
        const complete =
          currency &&
          byLine.length &&
          byLine.every(
            (attempts) =>
              attempts.length &&
              attempts.every(
                (charge) =>
                  charge.currencyId === currency.id &&
                  moneyMinorUnits(charge.amount) ===
                    moneyMinorUnits(attempts[0].amount),
              ),
          );
        const total = complete
          ? {
              amount: moneyFromMinorUnits(
                byLine.reduce(
                  (sum, attempts) => sum + moneyMinorUnits(attempts[0].amount),
                  0n,
                ),
              ),
              symbol: currency.symbol,
              precision: currencyPrecision(currency),
            }
          : null;
        summaries.set(id, { items, total });
      }),
    );
    return summaries;
  }

  async read(
    storeId: string,
    orderId: string,
    canReadCosts: boolean,
  ): Promise<ICrmOrderContents> {
    const { ecommerce } = this.subject.modules;
    const [
      order,
      work,
      {
        scopes: [scope],
        products,
      },
      attempts,
    ] = await Promise.all([
      ecommerce.order.findById({ id: orderId }),
      ecommerce.order.work.findByOrder(orderId),
      this.storeLines(storeId, [orderId]),
      ecommerce.order.ordersToBillingModulePaymentIntents.find(
        criteria({ orderId }),
      ),
    ]);
    const { exclusive, ownLines } = scope;
    let payments: ICrmOrderContents["payments"];
    if (canReadCosts) {
      payments = await this.payments(storeId, orderId, exclusive, attempts);
    }
    const resultFiles: NonNullable<ICrmOrderContents["resultFiles"]> = [];
    if (work?.storeId === storeId) {
      const original = deliveredOrderWorkFile(work);
      for (const file of work.files) {
        resultFiles.push({
          id: file.previewFileId,
          mime: file.previewMimeType,
          name: file.previewName,
          createdAt: file.createdAt,
        });
        if (file === original && work.deliveredAt) {
          resultFiles.push({
            id: file.originalFileId,
            mime: file.originalMimeType,
            name: file.originalName,
            createdAt: work.deliveredAt,
            original: true,
          });
        }
      }
    }
    if (resultFiles.length) {
      const metadata = await this.subject.modules.fileStorage.file.find(
        inIds(
          "id",
          resultFiles.map((file) => file.id),
        ),
      );
      for (const file of resultFiles) {
        const stored = metadata.find((item) => item.id === file.id);
        file.name = stored?.adminTitle || file.name;
        file.mime = stored?.mimeType || file.mime;
      }
    }
    return {
      resultFiles,
      lines: ownLines.map((line) => {
        const product = products.get(line.productId);
        const saved = attempts.find(
          (link) =>
            link.orderLineId === line.id &&
            link.purchaseSnapshot?.charge.storeId === storeId,
        )?.purchaseSnapshot;
        return {
          id: line.id,
          productId: line.productId,
          quantity: line.quantity,
          title: product?.title ?? null,
          name:
            saved?.charge.title ||
            product?.adminTitle ||
            product?.slug ||
            line.productId,
          destination: { ...saved?.destination, ...line.destination },
        };
      }),
      comment: exclusive ? (order?.comment ?? null) : null,
      trackingNumber:
        work?.storeId === storeId
          ? ([...work.fulfillment].reverse().find((e) => e.trackingNumber)
              ?.trackingNumber ?? null)
          : null,
      payments,
    };
  }

  private async payments(
    storeId: string,
    orderId: string,
    exclusive: boolean,
    links: IPaymentLink[],
  ): Promise<NonNullable<ICrmOrderContents["payments"]>> {
    const ownLinks = links.filter((link) =>
      link.purchaseSnapshot
        ? link.purchaseSnapshot.charge.storeId === storeId
        : exclusive,
    );
    if (!ownLinks.length) {
      return [];
    }
    const { ecommerce, billing } = this.subject.modules;
    const ids = ownLinks.map((link) => link.billingModulePaymentIntentId);
    const [intents, invoiceLinks, currencyLinks, allOrders] = await Promise.all(
      [
        ecommerce.order.paymentIntent.find(inIds("id", ids)),
        billing.paymentIntentsToInvoices.find(inIds("paymentIntentId", ids)),
        billing.paymentIntentsToCurrencies.find(inIds("paymentIntentId", ids)),
        ecommerce.order.ordersToBillingModulePaymentIntents.find(
          inIds("billingModulePaymentIntentId", ids),
        ),
      ],
    );
    const invoiceIds = invoiceLinks.map((link) => link.invoiceId);
    const currencyIds = [
      ...currencyLinks.map((link) => link.currencyId),
      ...ownLinks.flatMap((link) =>
        link.purchaseSnapshot ? [link.purchaseSnapshot.currencyId] : [],
      ),
      ...intents.flatMap((intent) =>
        intent.checkoutCurrencyId ? [intent.checkoutCurrencyId] : [],
      ),
    ];
    const [invoices, currencies, invoiceIntents] = await Promise.all([
      invoiceIds.length ? billing.invoice.find(inIds("id", invoiceIds)) : [],
      currencyIds.length ? billing.currency.find(inIds("id", currencyIds)) : [],
      invoiceIds.length
        ? billing.paymentIntentsToInvoices.find(inIds("invoiceId", invoiceIds))
        : [],
    ]);
    const otherIds = invoiceIntents
      .map((link) => link.paymentIntentId)
      .filter((id) => !ids.includes(id));
    const otherIntents = otherIds.length
      ? await ecommerce.order.paymentIntent.find(inIds("id", otherIds))
      : [];
    const invoiceAmounts = new Map<string, bigint>();
    for (const invoice of invoices) {
      const memberIds = new Set(
        invoiceIntents
          .filter((link) => link.invoiceId === invoice.id)
          .map((link) => link.paymentIntentId),
      );
      const members = [...intents, ...otherIntents].filter((intent) =>
        memberIds.has(intent.id),
      );
      if (memberIds.size && members.length === memberIds.size) {
        invoiceAmounts.set(
          invoice.id,
          members.reduce(
            (sum, intent) => sum + moneyMinorUnits(intent.amount),
            0n,
          ),
        );
      }
    }
    return intents.map((intent) => {
      const local = ownLinks.filter(
        (link) => link.billingModulePaymentIntentId === intent.id,
      );
      const exclusiveIntent =
        exclusive &&
        allOrders
          .filter((link) => link.billingModulePaymentIntentId === intent.id)
          .every(
            (link) =>
              link.orderId === orderId &&
              (!link.purchaseSnapshot ||
                link.purchaseSnapshot.charge.storeId === storeId),
          );
      const charges = local.flatMap((link) =>
        link.purchaseSnapshot ? [link.purchaseSnapshot] : [],
      );
      let amount: number | null = null;
      if (
        charges.length === local.length &&
        charges.every((charge) => charge.currencyId === charges[0].currencyId)
      ) {
        amount = moneyFromMinorUnits(
          charges.reduce(
            (sum, charge) => sum + moneyMinorUnits(charge.amount),
            0n,
          ),
        );
      } else if (exclusiveIntent && !charges.length) {
        amount = intent.amount;
      }
      const currenciesForIntent = new Set([
        ...charges.map((charge) => charge.currencyId),
        ...currencyLinks
          .filter((link) => link.paymentIntentId === intent.id)
          .map((link) => link.currencyId),
      ]);
      if (intent.checkoutCurrencyId) {
        currenciesForIntent.add(intent.checkoutCurrencyId);
      }
      const currencyId =
        currenciesForIntent.size === 1
          ? [...currenciesForIntent][0]
          : undefined;
      if (currenciesForIntent.size > 1) {
        amount = null;
      }
      const currency = currencies.find((item) => item.id === currencyId);
      const associated = invoices.filter((invoice) =>
        invoiceLinks.some(
          (link) =>
            link.paymentIntentId === intent.id && link.invoiceId === invoice.id,
        ),
      );
      const paidInvoices = associated.filter(
        (invoice) => invoice.status === "paid",
      );
      let paid: number | null = 0;
      if (intent.status === "succeeded" || paidInvoices.length) {
        paid = null;
        const [invoice] = paidInvoices;
        if (
          paidInvoices.length === 1 &&
          currencyId &&
          isConfirmedInvoice(intent, invoice) &&
          invoiceAmounts.get(invoice.id) === moneyMinorUnits(invoice.amount)
        ) {
          paid = amount;
        }
      }
      return {
        id: intent.id,
        status: intent.status,
        amount,
        currency: currency?.symbol || currency?.title || null,
        paid,
        invoices: associated.map(({ id, status }) => ({ id, status })),
      };
    });
  }
}

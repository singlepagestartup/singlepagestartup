import type {
  IModel as IEcommerceModuleOrder,
  IPurchaseDetails,
} from "@sps/ecommerce/models/order/sdk/model";
import type { Service as SubjectService } from "../../index";
import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { moneyFromMinorUnits, moneyMinorUnits } from "@sps/backend-utils";

export interface IExecuteProps {
  subjectId: string;
  orders: IEcommerceModuleOrder[];
}

interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "ecommerceModuleOrderPurchasePayments"
    | "ecommerceModule"
    | "billingModule"
    | "fileStorageModule"
    | "subjectsToEcommerceModuleOrders"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute({ subjectId, orders }: IExecuteProps) {
    const { service } = this.dependencies;
    const { retryableIds, paymentUrls } =
      await service.ecommerceModuleOrderPurchasePayments({
        subjectId,
        orders,
      });
    const saved = await this.savedPayments(
      subjectId,
      orders.map((order) => order.id),
    );
    const productIdByOrder = new Map<string, string>();
    for (const [orderId, payment] of saved) {
      const product = payment.charges?.find(
        ({ charge }) => charge.role === "product",
      );
      if (product) {
        productIdByOrder.set(orderId, product.charge.productId);
      }
    }
    const products: Pick<IEcommerceModuleProduct, "id" | "slug">[] =
      productIdByOrder.size
        ? await service.ecommerceModule.product.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: [...new Set(productIdByOrder.values())],
                  },
                ],
              },
            },
          })
        : [];
    const slugByProduct = new Map(products.map(({ id, slug }) => [id, slug]));
    const nextBySource = new Map<string, IPurchaseDetails["nextPeriod"]>();
    const periodOrderIds = orders
      .filter((order) => order.subscriptionPeriodInvoiceId)
      .map((order) => order.id);
    if (periodOrderIds.length) {
      const nextOrders = (await service.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              {
                column: "subscriptionSourceOrderId",
                method: "inArray",
                value: periodOrderIds,
              },
            ],
          },
        },
      })) as IEcommerceModuleOrder[];
      if (nextOrders.length) {
        const owned = await service.subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                { column: "subjectId", method: "eq", value: subjectId },
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: nextOrders.map((order) => order.id),
                },
              ],
            },
          },
        });
        const allowed = nextOrders.filter((order) =>
          owned.some(
            (owner) =>
              owner.subjectId === subjectId &&
              owner.ecommerceModuleOrderId === order.id,
          ),
        );
        const nextPayments = await service.ecommerceModuleOrderPurchasePayments(
          { subjectId, orders: allowed },
        );
        const nextSaved = await this.savedPayments(
          subjectId,
          allowed.map((order) => order.id),
        );
        for (const next of allowed) {
          if (!next.subscriptionSourceOrderId) {
            continue;
          }
          const payment = nextSaved.get(next.id);
          const totals =
            payment?.totals ??
            (await service.ecommerceModule.order.findByIdTotal({ id: next.id }))
              .totals;
          nextBySource.set(next.subscriptionSourceOrderId, {
            orderId: next.id,
            status: next.status,
            ...((next.subscriptionPeriodStartsAt ??
            next.subscriptionScheduledStartsAt)
              ? {
                  startsAt: new Date(
                    (next.subscriptionPeriodStartsAt ??
                      next.subscriptionScheduledStartsAt)!,
                  ).toISOString(),
                }
              : {}),
            ...((next.subscriptionPeriodEndsAt ??
            next.subscriptionScheduledEndsAt)
              ? {
                  endsAt: new Date(
                    (next.subscriptionPeriodEndsAt ??
                      next.subscriptionScheduledEndsAt)!,
                  ).toISOString(),
                }
              : {}),
            paymentUrl: nextPayments.paymentUrls.get(next.id),
            totals,
            requiresConfirmation: next.type === "cart" && next.status === "new",
          });
        }
      }
    }
    const receiptOrderIds = orders
      .filter((order) => !retryableIds.has(order.id))
      .map((order) => order.id);
    let receiptLinks: {
      orderId: string;
      fileStorageModuleFileId: string;
    }[] = [];
    if (receiptOrderIds.length) {
      receiptLinks =
        await service.ecommerceModule.ordersToFileStorageModuleFiles.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "inArray",
                  value: receiptOrderIds,
                },
                {
                  column: "variant",
                  method: "eq",
                  value: "receipt-default",
                },
              ],
            },
          },
        });
    }
    const linksByOrder = new Map<string, typeof receiptLinks>();
    for (const link of receiptLinks) {
      const existing = linksByOrder.get(link.orderId) ?? [];
      existing.push(link);
      linksByOrder.set(link.orderId, existing);
    }
    const receiptIds = [
      ...new Set(receiptLinks.map((link) => link.fileStorageModuleFileId)),
    ];
    const filesById = new Map<string, IPurchaseDetails["receipts"][number]>();
    if (receiptIds.length) {
      const files: IPurchaseDetails["receipts"] =
        await service.fileStorageModule.file.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: receiptIds }],
            },
          },
        });
      for (const file of files) {
        if (file.file?.trim()) {
          filesById.set(file.id, file);
        }
      }
    }
    const purchases: (IEcommerceModuleOrder & {
      purchaseDetails: IPurchaseDetails;
    })[] = [];
    for (const order of orders) {
      const payment = saved.get(order.id);
      const productId = productIdByOrder.get(order.id);
      const totals = payment
        ? { totals: payment.totals, unpriced: [] }
        : await service.ecommerceModule.order.findByIdTotal({ id: order.id });
      const receipts = (linksByOrder.get(order.id) ?? []).flatMap(
        (link) => filesById.get(link.fileStorageModuleFileId) ?? [],
      );
      purchases.push({
        ...order,
        purchaseDetails: {
          primaryProductSlug: productId
            ? slugByProduct.get(productId)
            : undefined,
          canRepeatPayment: retryableIds.has(order.id),
          ...(nextBySource.has(order.id)
            ? { nextPeriod: nextBySource.get(order.id) }
            : {}),
          ...(payment?.canPayNextPeriod &&
          !nextBySource.has(order.id) &&
          order.subscriptionPeriodInvoiceId &&
          order.subscriptionPeriodEndsAt &&
          new Date(order.subscriptionPeriodEndsAt).getTime() <=
            Date.now() + 24 * 60 * 60 * 1000 &&
          !order.subscriptionRevokedAt
            ? { canPayNextPeriod: true }
            : {}),
          ...(payment?.requiresReconciliation
            ? { requiresReconciliation: true }
            : {}),
          paymentUrl: paymentUrls.get(order.id),
          totals: totals.totals,
          receipts,
          ...(payment
            ? { charges: payment.charges, invoiceShares: payment.invoiceShares }
            : {}),
          ...(totals.unpriced.length ? { unpriced: totals.unpriced } : {}),
        },
      });
    }
    return purchases;
  }

  private async savedPayments(subjectId: string, orderIds: string[]) {
    const { service } = this.dependencies;
    const result = new Map<
      string,
      Pick<
        IPurchaseDetails,
        | "charges"
        | "invoiceShares"
        | "totals"
        | "canPayNextPeriod"
        | "requiresReconciliation"
      >
    >();
    if (!orderIds.length) {
      return result;
    }
    const links: IPaymentLink[] =
      await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "inArray", value: orderIds }],
          },
        },
      });
    const intentIds = [
      ...new Set(links.map((link) => link.billingModulePaymentIntentId)),
    ];
    if (!intentIds.length) {
      return result;
    }
    const [intents, invoiceLinks, currencyLinks, allOrderLinks] =
      await Promise.all([
        service.billingModule.paymentIntent.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: intentIds }],
            },
          },
        }),
        service.billingModule.paymentIntentsToInvoices.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "inArray",
                  value: intentIds,
                },
              ],
            },
          },
        }),
        service.billingModule.paymentIntentsToCurrencies.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "inArray",
                  value: intentIds,
                },
              ],
            },
          },
        }),
        service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
          params: {
            filters: {
              and: [
                {
                  column: "billingModulePaymentIntentId",
                  method: "inArray",
                  value: intentIds,
                },
              ],
            },
          },
        }),
      ]);
    if (!invoiceLinks.length) {
      return result;
    }
    const [invoices, currencies] = await Promise.all([
      service.billingModule.invoice.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: [...new Set(invoiceLinks.map((link) => link.invoiceId))],
              },
            ],
          },
        },
      }),
      service.billingModule.currency.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: [
                  ...new Set(currencyLinks.map((link) => link.currencyId)),
                ],
              },
            ],
          },
        },
      }),
    ]);
    const fullInvoiceLinks =
      await service.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "invoiceId",
                method: "inArray",
                value: invoices.map((invoice) => invoice.id),
              },
            ],
          },
        },
      });
    const fullIntentIds = [
      ...new Set(fullInvoiceLinks.map((link) => link.paymentIntentId)),
    ];
    const fullOrderLinks: IPaymentLink[] = fullIntentIds.length
      ? await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
          params: {
            filters: {
              and: [
                {
                  column: "billingModulePaymentIntentId",
                  method: "inArray",
                  value: fullIntentIds,
                },
              ],
            },
          },
        })
      : allOrderLinks;
    const linkedOrderIds = [
      ...new Set(fullOrderLinks.map((link) => link.orderId)),
    ];
    const ownership = linkedOrderIds.length
      ? await service.subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: linkedOrderIds,
                },
              ],
            },
          },
        })
      : [];
    const ownedOrders = new Set(
      ownership
        .filter((link) => link.subjectId === subjectId)
        .map((link) => link.ecommerceModuleOrderId),
    );
    for (const link of ownership) {
      if (link.subjectId !== subjectId) {
        ownedOrders.delete(link.ecommerceModuleOrderId);
      }
    }
    const intentsWithOrders = new Set(
      fullOrderLinks.map((link) => link.billingModulePaymentIntentId),
    );
    for (const orderId of orderIds) {
      const orderLinks = links.filter((link) => link.orderId === orderId);
      const candidates = intents.filter((intent) =>
        orderLinks.some(
          (link) => link.billingModulePaymentIntentId === intent.id,
        ),
      );
      candidates.sort((left, right) => {
        const paid =
          Number(right.status === "succeeded") -
          Number(left.status === "succeeded");
        return (
          paid ||
          new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime() ||
          right.id.localeCompare(left.id)
        );
      });
      const intent = candidates[0];
      if (!intent) {
        continue;
      }
      const charges = orderLinks.flatMap((link) => {
        if (
          link.billingModulePaymentIntentId !== intent.id ||
          !link.purchaseSnapshot
        ) {
          return [];
        }
        return [
          {
            ...link.purchaseSnapshot,
            orderLineId: link.orderLineId ?? undefined,
          },
        ];
      });
      const currencyId =
        charges[0]?.currencyId ??
        currencyLinks.find((link) => link.paymentIntentId === intent.id)
          ?.currencyId;
      const currency = currencies.find((entry) => entry.id === currencyId);
      if (!currency) {
        continue;
      }
      const invoiceIds = invoiceLinks
        .filter((link) => link.paymentIntentId === intent.id)
        .map((link) => link.invoiceId);
      const selectedInvoices = invoices.filter((invoice) =>
        invoiceIds.includes(invoice.id),
      );
      selectedInvoices.sort(
        (left, right) =>
          Number(right.status === "paid") - Number(left.status === "paid") ||
          new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime() ||
          right.id.localeCompare(left.id),
      );
      const invoice = selectedInvoices[0];
      if (!invoice) {
        continue;
      }
      const sharedIntentIds = new Set<string>(
        fullInvoiceLinks
          .filter((link) => link.invoiceId === invoice.id)
          .map((link) => link.paymentIntentId),
      );
      const sharedOrderIds = [
        ...new Set(
          fullOrderLinks
            .filter((link) =>
              sharedIntentIds.has(link.billingModulePaymentIntentId),
            )
            .map((link) => link.orderId),
        ),
      ].sort();
      const amount = charges.length
        ? moneyFromMinorUnits(
            charges.reduce(
              (sum, charge) => sum + moneyMinorUnits(charge.amount),
              0n,
            ),
          )
        : null;
      const ownsWholeInvoice =
        sharedOrderIds.includes(orderId) &&
        [...sharedIntentIds].every((id) => intentsWithOrders.has(id)) &&
        sharedOrderIds.every((id) => ownedOrders.has(id));
      const showSharedTotal =
        ownsWholeInvoice && amount === null && sharedOrderIds[0] === orderId;
      result.set(orderId, {
        canPayNextPeriod:
          intent.type === "one_off" &&
          intent.status === "succeeded" &&
          charges.some((charge) => charge.purchaseType === "subscription"),
        requiresReconciliation: intent.status === "requires_reconciliation",
        charges,
        totals:
          amount !== null
            ? [{ total: amount, billingModuleCurrency: currency }]
            : showSharedTotal
              ? [{ total: invoice.amount, billingModuleCurrency: currency }]
              : [],
        invoiceShares: ownsWholeInvoice
          ? [
              {
                invoiceId: invoice.id,
                invoiceAmount: invoice.amount,
                amount,
                currencyId: currency.id,
                orderIds: sharedOrderIds,
                showSharedTotal,
                status: invoice.status,
              },
            ]
          : [],
      });
    }
    return result;
  }
}

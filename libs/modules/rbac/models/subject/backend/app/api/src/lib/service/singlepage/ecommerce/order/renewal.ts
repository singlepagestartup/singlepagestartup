import type { SubjectServiceDependencies } from "../../index";
import type { Repository } from "../../../../repository";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { intervalEnd } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period/utils";
import { moneyMinorUnits } from "@sps/backend-utils";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  cancel?: boolean;
}
export interface IResult {
  orderId?: string;
  requiresConfirmation?: boolean;
}
export type IRenewal = (props: IExecuteProps) => Promise<IResult>;
interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: SubjectServiceDependencies<
    | "ecommerceModule"
    | "billingModule"
    | "ecommerceModuleOrderStripePayment"
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleOrderRepeat"
    | "ecommerceOrderCheckout"
  >;
}

/** Subject-owned preparation; only the payment provider schedules automatic debits. */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    props: IExecuteProps,
    internal?: { skipProviderReconciliation?: boolean },
  ): Promise<IResult> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    if (props.cancel) {
      await this.cancelSuccessors(props);
      return {};
    }
    let source = (await service.ecommerceModule.order.findById({
      id: props.orderId,
    })) as IOrder | null;
    if (
      !source ||
      source.type !== "history" ||
      !source.subscriptionPeriodInvoiceId ||
      !source.subscriptionPeriodEndsAt ||
      source.subscriptionRevokedAt ||
      ["requested_cancelation", "canceling", "canceled", "completed"].includes(
        source.status,
      )
    ) {
      return {};
    }
    const links =
      (await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: source.id }],
          },
        },
      })) as IPaymentLink[];
    const anchorLinks =
      await service.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "invoiceId",
                method: "eq",
                value: source.subscriptionPeriodInvoiceId,
              },
            ],
          },
        },
      });
    const ids = [
      ...new Set<string>(
        anchorLinks.map(
          (link: { paymentIntentId: string }) => link.paymentIntentId,
        ),
      ),
    ].filter((id) =>
      links.some((link) => link.billingModulePaymentIntentId === id),
    );
    if (ids.length !== 1) {
      throw new Error(
        "Conflict error. Subscription period payment is ambiguous",
      );
    }
    const intent = await service.billingModule.paymentIntent.findById({
      id: ids[0],
    });
    const invoice = await service.billingModule.invoice.findById({
      id: source.subscriptionPeriodInvoiceId,
    });
    const snapshots = links
      .filter(
        (link) =>
          link.billingModulePaymentIntentId === ids[0] && link.purchaseSnapshot,
      )
      .map((link) => link.purchaseSnapshot!);
    if (intent?.status !== "succeeded" || invoice?.status !== "paid") {
      return {};
    }
    const providerManagedRenewal =
      service.billingModule.paymentIntent.schedulesSubscriptionPayments({
        provider: invoice.provider ?? "",
      }) &&
      (intent.type === "subscription" ||
        typeof intent.checkoutMetadata?.providerContractPaymentIntentId ===
          "string");
    if (
      providerManagedRenewal &&
      !source.subscriptionScheduledEndsAt &&
      !internal?.skipProviderReconciliation
    ) {
      await service.ecommerceModuleOrderStripePayment.reconcile({
        id:
          intent.checkoutMetadata?.providerContractPaymentIntentId ?? intent.id,
      });
      source = (await service.ecommerceModule.order.findById({
        id: props.orderId,
      })) as IOrder;
    }
    if (
      new Date(
        source.subscriptionScheduledEndsAt ?? source.subscriptionPeriodEndsAt!,
      ).getTime() >
      Date.now() + 24 * 60 * 60 * 1000
    ) {
      return {};
    }
    let result: { orderIds: string[] };
    try {
      result = await service.ecommerceModuleOrderRepeat({
        subjectId: props.subjectId,
        orderId: props.orderId,
        mode: "next-period",
      });
    } catch (error) {
      return this.rejectPreparation(error, source.id, providerManagedRenewal);
    }
    const orderId = result.orderIds[0];
    if (!orderId) {
      throw new Error(
        "Conflict error. Next subscription order was not prepared",
      );
    }
    const existing =
      await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    if (existing.length) {
      const next = await service.ecommerceModule.order.findById({
        id: orderId,
      });
      if (next?.subscriptionPeriodInvoiceId) {
        return { orderId };
      }
      if (providerManagedRenewal && !internal?.skipProviderReconciliation) {
        await service.ecommerceModuleOrderStripePayment.reconcile({
          id:
            intent.checkoutMetadata?.providerContractPaymentIntentId ??
            intent.id,
        });
      }
      return { orderId };
    }
    const lines = await service.ecommerceModule.ordersToProducts.find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    const main = lines.find((line) => !line.parentLineId);
    const currencies =
      await service.ecommerceModule.ordersToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    const currencyId =
      snapshots[0]?.currencyId ?? currencies[0]?.billingModuleCurrencyId;
    if (!currencyId) {
      throw new Error(
        "Conflict error. Subscription currency requires reconciliation",
      );
    }
    if (!main) {
      return { orderId, requiresConfirmation: true };
    }
    let quote: { amount: string | null; issues: unknown[] };
    if (main.offerId) {
      const fulfillment =
        await service.ecommerceModule.order.fulfillmentQuoteOptions({
          id: orderId,
        });
      const inputs = [
        {
          offerId: main.offerId,
          quantity: main.quantity,
          lineId: main.id,
          currencyId,
          destination: main.destination,
          services: lines
            .filter((line) => line.parentLineId === main.id)
            .map((line) => ({
              offerId: line.offerId!,
              quantity: line.quantity,
              lineId: line.id,
            })),
        },
      ];
      const quotes = await service.ecommerceModule.storesToProducts.quoteMany(
        inputs,
        fulfillment,
      );
      quote = quotes[0];
    } else {
      const terms =
        await service.ecommerceModule.order.findByIdCheckoutAttributesByCurrency(
          { id: orderId, billingModuleCurrencyId: currencyId },
        );
      const next = await service.ecommerceModule.order.findById({
        id: orderId,
      });
      quote = {
        amount:
          terms.type === "subscription" &&
          terms.interval === next?.subscriptionSourceInterval
            ? String(terms.amount)
            : null,
        issues: [],
      };
    }
    const expected = snapshots.length
      ? snapshots
          .filter(
            (snapshot) =>
              snapshot.charge.role === "product" ||
              snapshot.charge.recurrence === "each",
          )
          .reduce(
            (sum, snapshot) =>
              sum + moneyMinorUnits(snapshot.amount ?? snapshot.charge.amount),
            0n,
          )
      : moneyMinorUnits(invoice.amount);
    if (
      !quote ||
      quote.amount === null ||
      quote.issues.length ||
      moneyMinorUnits(quote.amount) !== expected
    ) {
      if (providerManagedRenewal) {
        await service.ecommerceModule.order.stopSubscriptionRenewal({
          id: source.id,
        });
      }
      return { orderId, requiresConfirmation: true };
    }
    const provider = invoice.provider;
    if (!provider) {
      throw new Error("Conflict error. Subscription provider is unavailable");
    }
    const contractId =
      intent.checkoutMetadata?.providerContractPaymentIntentId ?? intent.id;
    if (providerManagedRenewal && source.subscriptionScheduledEndsAt) {
      await this.dependencies.repository.withSubjectLock(
        { subjectId: props.subjectId },
        async () => {
          await service.ecommerceModule.order.lockForLifecycle({ id: orderId });
          const next = await service.ecommerceModule.order.findById({
            id: orderId,
          });
          if (
            !next.subscriptionScheduledStartsAt &&
            !next.subscriptionPeriodInvoiceId
          ) {
            const startsAt = new Date(source!.subscriptionScheduledEndsAt!);
            await service.ecommerceModule.order.configureNextPeriod({
              id: orderId,
              startsAt,
              endsAt: intervalEnd(startsAt, next.subscriptionSourceInterval),
            });
          }
        },
      );
    }
    try {
      await service.ecommerceOrderCheckout(
        {
          id: props.subjectId,
          provider,
          email: intent.checkoutMetadata?.email,
          account: intent.checkoutMetadata?.account,
          ecommerceModule: { orders: [{ id: orderId }] },
        },
        providerManagedRenewal
          ? {
              deferProviderCheckout: true,
              providerContractPaymentIntentId: contractId,
            }
          : { manualSubscriptionPeriod: true },
      );
    } catch (error) {
      return this.rejectPreparation(error, source.id, providerManagedRenewal);
    }
    if (providerManagedRenewal && !internal?.skipProviderReconciliation) {
      await service.ecommerceModuleOrderStripePayment.reconcile({
        id: contractId,
      });
    }
    return { orderId };
  }

  private async rejectPreparation(
    error: unknown,
    sourceId: string,
    providerManagedRenewal: boolean,
  ): Promise<never> {
    const businessConflict =
      error instanceof Error &&
      (error.message.startsWith(
        "Conflict error. Next delivery is unavailable:",
      ) ||
        error.message.startsWith("Conflict error. Stock unavailable:") ||
        error.message.startsWith("Conflict error. Checkout quote changed:") ||
        error.message.startsWith("Conflict error. Checkout price changed:") ||
        error.message.startsWith(
          "Conflict error. Legacy subscription delivery requires reconciliation",
        ) ||
        error.message.startsWith(
          "Conflict error. Legacy physical subscription needs an offer",
        ));
    if (providerManagedRenewal && businessConflict) {
      await this.dependencies.service.ecommerceModule.order.stopSubscriptionRenewal(
        { id: sourceId },
      );
    }
    throw error;
  }

  private async cancelSuccessors(props: IExecuteProps) {
    const { service, repository } = this.dependencies;
    await repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        const queue = [props.orderId];
        const seen = new Set<string>();
        while (queue.length) {
          const sourceId = queue.shift()!;
          if (seen.has(sourceId)) {
            continue;
          }
          seen.add(sourceId);
          const children = (await service.ecommerceModule.order.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subscriptionSourceOrderId",
                    method: "eq",
                    value: sourceId,
                  },
                ],
              },
            },
          })) as IOrder[];
          for (const child of children) {
            await service.ecommerceModuleOrderAssertAccess({
              subjectId: props.subjectId,
              orderId: child.id,
            });
            await service.ecommerceModule.order.lockForLifecycle({
              id: child.id,
            });
            queue.push(child.id);
            const current = (await service.ecommerceModule.order.findById({
              id: child.id,
            })) as IOrder;
            if (current.subscriptionPeriodInvoiceId) {
              if (
                ![
                  "requested_cancelation",
                  "canceled",
                  "canceling",
                  "completed",
                  "expired",
                ].includes(current.status)
              ) {
                await service.ecommerceModule.order.update({
                  id: current.id,
                  data: { ...current, status: "requested_cancelation" },
                });
              }
              continue;
            }
            const links =
              await service.ecommerceModule.ordersToBillingModulePaymentIntents.find(
                {
                  params: {
                    filters: {
                      and: [
                        { column: "orderId", method: "eq", value: child.id },
                      ],
                    },
                  },
                },
              );
            const intentIds = [
              ...new Set<string>(
                links.map(
                  (link: { billingModulePaymentIntentId: string }) =>
                    link.billingModulePaymentIntentId,
                ),
              ),
            ];
            for (const id of intentIds) {
              const intent = await service.billingModule.paymentIntent.findById(
                { id },
              );
              if (
                intent &&
                !["succeeded", "requires_reconciliation"].includes(
                  intent.status,
                )
              ) {
                await service.billingModule.paymentIntent.failUnpaidIntent(
                  id,
                  intent.status,
                );
                await service.billingModule.paymentIntent.update({
                  id,
                  data: { status: "canceled" },
                });
                const invoiceLinks =
                  await service.billingModule.paymentIntentsToInvoices.find({
                    params: {
                      filters: {
                        and: [
                          {
                            column: "paymentIntentId",
                            method: "eq",
                            value: id,
                          },
                        ],
                      },
                    },
                  });
                for (const link of invoiceLinks) {
                  const invoice = await service.billingModule.invoice.findById({
                    id: link.invoiceId,
                  });
                  if (invoice && ["open", "draft"].includes(invoice.status)) {
                    await service.billingModule.invoice.update({
                      id: invoice.id,
                      data: { ...invoice, status: "void" },
                    });
                  }
                }
              }
            }
            await service.ecommerceModule.order.update({
              id: child.id,
              data: { ...current, type: "history", status: "canceled" },
            });
          }
        }
      },
    );
  }
}

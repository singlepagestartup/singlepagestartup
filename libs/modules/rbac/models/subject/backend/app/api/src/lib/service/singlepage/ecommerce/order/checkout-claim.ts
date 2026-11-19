import type { SubjectServiceDependencies } from "../../index";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { Repository } from "../../../../repository";
import type { IModel as IOrderIntent } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { moneyMinorUnits } from "@sps/backend-utils";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";

interface ILineSnapshot {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  updatedAt?: Date | string;
}
interface ICurrencySnapshot {
  id: string;
  orderId: string;
  billingModuleCurrencyId: string | null;
  updatedAt?: Date | string;
}
export interface IExecuteProps {
  subjectId: string;
  orderIds: string[];
  comment?: string;
  expectedLines?: ILineSnapshot[];
  expectedCurrencies?: ICurrencySnapshot[];
  resumeExisting?: boolean;
}
export interface IConstructorProps {
  module: Pick<
    SubjectServiceDependencies["module"],
    "subjectsToEcommerceModuleOrders"
  >;
  modules: Pick<SubjectServiceDependencies["modules"], "billing" | "ecommerce">;
  repository: Pick<Repository, "withSubjectLock">;
  settledOrderIds: (props: { orderIds: string[] }) => Promise<Set<string>>;
}

export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async execute(
    props: IExecuteProps,
  ): Promise<{ invoices?: IInvoice[]; preparedPaymentIntentIds?: string[] }> {
    const { repository, module, modules } = this.dependencies;
    const { ecommerce, billing } = modules;
    const { subjectsToEcommerceModuleOrders } = module;
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        const orderIds = [...new Set(props.orderIds)].sort();
        for (const id of orderIds) {
          await ecommerce.order.lockForLifecycle({ id });
        }
        const owners = await subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: orderIds,
                },
              ],
            },
          },
        });
        const lockedOrders: IOrder[] = [];
        for (const id of orderIds) {
          const ownership = owners.filter(
            (link) => link.ecommerceModuleOrderId === id,
          );
          if (
            !ownership.length ||
            ownership.some((owner) => owner.subjectId !== props.subjectId)
          ) {
            throw new Error(
              "Permission error. Checkout order no longer belongs to the current subject",
            );
          }
          const order = await ecommerce.order.findById({ id });
          const openCart = order?.type === "cart" && order.status === "new";
          const payingHistory =
            props.resumeExisting &&
            order?.type === "history" &&
            [
              "paying",
              "paid",
              "approving",
              "packaging",
              "delivering",
              "delivered",
            ].includes(order.status);
          if (!order || (!openCart && !payingHistory)) {
            throw new Error(
              "Conflict error. Checkout order is no longer an open cart",
            );
          }
          if (
            !payingHistory &&
            (order.subscriptionPeriodInvoiceId ||
              order.subscriptionPeriodStartsAt ||
              order.subscriptionPeriodEndsAt ||
              order.subscriptionRevokedAt)
          ) {
            throw new Error(
              "Conflict error. Checkout order has a recorded subscription period",
            );
          }
          if (order.subscriptionSourceOrderId && !payingHistory) {
            await ecommerce.order.lockForLifecycle({
              id: order.subscriptionSourceOrderId,
            });
            const source = await ecommerce.order.findById({
              id: order.subscriptionSourceOrderId,
            });
            const sourceOwners = await subjectsToEcommerceModuleOrders.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "ecommerceModuleOrderId",
                      method: "eq",
                      value: order.subscriptionSourceOrderId,
                    },
                  ],
                },
              },
            });
            if (
              !source ||
              source.subscriptionRevokedAt ||
              source.subscriptionPeriodInvoiceId !==
                order.subscriptionSourceInvoiceId ||
              [
                "requested_cancelation",
                "canceling",
                "canceled",
                "completed",
              ].includes(source.status) ||
              !sourceOwners.length ||
              sourceOwners.some((owner) => owner.subjectId !== props.subjectId)
            ) {
              throw new Error(
                "Conflict error. Source subscription no longer permits another paid period",
              );
            }
          }
          lockedOrders.push(order);
        }
        const filters = {
          and: [
            { column: "orderId", method: "inArray" as const, value: orderIds },
          ],
        };
        const paymentLinks: IOrderIntent[] =
          await ecommerce.order.ordersToBillingModulePaymentIntents.find({
            params: { filters },
          });
        const settledIds = await this.dependencies.settledOrderIds({
          orderIds,
        });
        if (
          !props.resumeExisting &&
          orderIds.some((id) => settledIds.has(id))
        ) {
          throw new Error(
            "Conflict error. Checkout order already has a settled payment",
          );
        }
        let existingInvoices: IInvoice[] | undefined;
        const preparedPaymentIntentIds: string[] = [];
        if (paymentLinks.length) {
          const intentIds = [
            ...new Set(
              paymentLinks.map(
                (link: { billingModulePaymentIntentId: string }) =>
                  link.billingModulePaymentIntentId,
              ),
            ),
          ];
          const intents = await ecommerce.order.paymentIntent.find({
            params: {
              filters: {
                and: [{ column: "id", method: "inArray", value: intentIds }],
              },
            },
          });
          const invoiceLinks = await billing.paymentIntentsToInvoices.find({
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
          });
          let invoices: IInvoice[] = [];
          if (invoiceLinks.length) {
            invoices = await billing.invoice.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: invoiceLinks.map(
                        (link: { invoiceId: string }) => link.invoiceId,
                      ),
                    },
                  ],
                },
              },
            });
          }
          const invoiceById = new Map(
            invoices.map((invoice) => [invoice.id, invoice]),
          );
          const invoicesByIntentId = new Map<string, IInvoice[]>();
          for (const link of invoiceLinks) {
            const invoice = invoiceById.get(link.invoiceId);
            if (!invoice) {
              throw new Error(
                "Conflict error. Cart has an unresolved payment attempt",
              );
            }
            const linked = invoicesByIntentId.get(link.paymentIntentId) ?? [];
            if (!linked.some((entry) => entry.id === invoice.id)) {
              linked.push(invoice);
            }
            invoicesByIntentId.set(link.paymentIntentId, linked);
          }
          for (const intent of intents) {
            if (!["failed", "canceled"].includes(intent.status)) {
              continue;
            }
            const linked = invoicesByIntentId.get(intent.id) ?? [];
            if (
              linked.some((invoice) =>
                ["open", "draft"].includes(invoice.status),
              )
            ) {
              throw new Error(
                "Conflict error. Cart has an unresolved payment attempt",
              );
            }
          }
          const activeIntents = intents.filter(
            (intent) => !["failed", "canceled"].includes(intent.status),
          );
          if (intents.length !== intentIds.length) {
            throw new Error(
              "Conflict error. Cart has an unresolved payment attempt",
            );
          }
          if (activeIntents.length) {
            const selectedIntentIds = activeIntents.map((intent) => intent.id);
            const selectedInvoices = new Map<string, IInvoice>();
            for (const intent of activeIntents) {
              const linkedInvoices = invoicesByIntentId.get(intent.id) ?? [];
              const payable = linkedInvoices.filter((invoice) =>
                ["open", "draft"].includes(invoice.status),
              );
              const paid = linkedInvoices
                .filter((invoice) => invoice.status === "paid")
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                );
              const invoice = payable[0] ?? paid[0];
              if (
                payable.length > 1 ||
                (payable[0] &&
                  !payable[0].paymentUrl &&
                  !intent.checkoutMetadata?.providerContractPaymentIntentId)
              ) {
                throw new Error(
                  "Conflict error. Cart has an unresolved payment attempt",
                );
              }
              if (invoice) {
                selectedInvoices.set(invoice.id, invoice);
                continue;
              }
              const allocations = paymentLinks.filter(
                (link) => link.billingModulePaymentIntentId === intent.id,
              );
              const prepared =
                intent.checkoutDispatchState === "prepared" &&
                intent.checkoutProvider &&
                intent.checkoutCurrencyId &&
                intent.checkoutMetadata &&
                allocations.length &&
                allocations.every(
                  (link) =>
                    link.purchaseSnapshot && link.reservationStatus === "held",
                );
              const allocatedAmount = allocations.reduce(
                (total, link) =>
                  total + moneyMinorUnits(link.purchaseSnapshot?.amount ?? 0),
                0n,
              );
              if (
                !prepared ||
                allocatedAmount !== moneyMinorUnits(intent.amount)
              ) {
                throw new Error(
                  "Conflict error. Cart has an unresolved payment attempt; provider outcome is unknown",
                );
              }
              preparedPaymentIntentIds.push(intent.id);
            }
            if (
              !(await this.attemptsCoverSelection(
                [...selectedInvoices.keys()],
                orderIds,
                selectedIntentIds,
              ))
            ) {
              throw new Error(
                "Conflict error. Cart has an unresolved payment attempt",
              );
            }
            existingInvoices = [...selectedInvoices.values()];
          }
        }

        if (props.expectedLines) {
          const lines = await ecommerce.ordersToProducts.find({
            params: { filters },
          });
          if (
            this.lineSnapshot(lines) !== this.lineSnapshot(props.expectedLines)
          ) {
            throw new Error(
              "Conflict error. Cart quantities changed during checkout",
            );
          }
        }
        if (props.expectedCurrencies) {
          const currencies =
            await ecommerce.ordersToBillingModuleCurrencies.find({
              params: { filters },
            });
          if (
            this.currencySnapshot(currencies) !==
            this.currencySnapshot(props.expectedCurrencies)
          ) {
            throw new Error(
              "Conflict error. Cart currency changed during checkout",
            );
          }
        }
        // Every order has been rechecked before the first claim is written.
        if (
          lockedOrders.some((order) => order.type === "history") &&
          !existingInvoices
        ) {
          throw new Error(
            "Conflict error. Historical order has no existing payable invoice",
          );
        }
        for (const order of lockedOrders) {
          if (order.type === "history") {
            continue;
          }
          await ecommerce.order.update({
            id: order.id,
            data: {
              ...order,
              type: "history",
              status: "paying",
              ...(props.comment !== undefined
                ? { comment: props.comment }
                : {}),
            },
          });
        }
        return {
          invoices: existingInvoices,
          ...(preparedPaymentIntentIds.length
            ? { preparedPaymentIntentIds }
            : {}),
        };
      },
    );
  }

  private lineSnapshot(rows: ILineSnapshot[]): string {
    return rows
      .map((row) =>
        [
          row.id,
          row.orderId,
          row.productId,
          row.quantity,
          String(row.updatedAt ?? ""),
        ].join("|"),
      )
      .sort()
      .join("\n");
  }

  private currencySnapshot(rows: ICurrencySnapshot[]): string {
    return rows
      .map((row) =>
        [
          row.id,
          row.orderId,
          row.billingModuleCurrencyId,
          String(row.updatedAt ?? ""),
        ].join("|"),
      )
      .sort()
      .join("\n");
  }

  private async attemptsCoverSelection(
    invoiceIds: string[],
    orderIds: string[],
    selectedIntentIds: string[],
  ): Promise<boolean> {
    const { ecommerce, billing } = this.dependencies.modules;
    if (invoiceIds.length) {
      const invoiceLinks = await billing.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              { column: "invoiceId", method: "inArray", value: invoiceIds },
            ],
          },
        },
      });
      if (
        invoiceLinks.some(
          (link) => !selectedIntentIds.includes(link.paymentIntentId),
        )
      ) {
        return false;
      }
    }
    const orderLinks: IOrderIntent[] =
      await ecommerce.order.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "inArray",
                value: selectedIntentIds,
              },
            ],
          },
        },
      });
    const linkedOrders = new Set(orderLinks.map((link) => link.orderId));
    const linkedIntents = new Set(
      orderLinks.map((link) => link.billingModulePaymentIntentId),
    );
    return (
      linkedIntents.size === selectedIntentIds.length &&
      linkedOrders.size === orderIds.length &&
      orderIds.every((id) => linkedOrders.has(id))
    );
  }
}

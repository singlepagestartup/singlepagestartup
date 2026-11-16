import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { Service as SubjectService } from "../../index";
import type { Repository } from "../../../../repository";
import type { IModel as IOrderIntent } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { IModel as IIntentInvoice } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import type { IModel as IPaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { IBillingModule, IEcommerceModule } from "../../../../di";

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
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  ecommerceModule: Pick<
    IEcommerceModule,
    | "order"
    | "ordersToProducts"
    | "ordersToBillingModuleCurrencies"
    | "ordersToBillingModulePaymentIntents"
  >;
  billingModule: IBillingModule;
  settledOrderIds: (props: { orderIds: string[] }) => Promise<Set<string>>;
  subjectsToEcommerceModuleOrders: Pick<
    SubjectService["subjectsToEcommerceModuleOrders"],
    "find"
  >;
}

export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<{ invoices?: IInvoice[] }> {
    const {
      repository,
      ecommerceModule,
      billingModule,
      subjectsToEcommerceModuleOrders,
    } = this.dependencies;
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        const orderIds = [...new Set(props.orderIds)].sort();
        for (const id of orderIds) {
          await ecommerceModule.order.lockForLifecycle({ id });
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
          const order = await ecommerceModule.order.findById({ id });
          if (!order || order.type !== "cart" || order.status !== "new") {
            throw new Error(
              "Conflict error. Checkout order is no longer an open cart",
            );
          }
          if (
            order.subscriptionPeriodInvoiceId ||
            order.subscriptionPeriodStartsAt ||
            order.subscriptionPeriodEndsAt ||
            order.subscriptionRevokedAt
          ) {
            throw new Error(
              "Conflict error. Checkout order has a recorded subscription period",
            );
          }
          lockedOrders.push(order);
        }
        const filters = {
          and: [{ column: "orderId", method: "inArray", value: orderIds }],
        };
        const paymentLinks: IOrderIntent[] =
          await ecommerceModule.ordersToBillingModulePaymentIntents.find({
            params: { filters },
          });
        const settledIds = await this.dependencies.settledOrderIds({
          orderIds,
        });
        if (orderIds.some((id) => settledIds.has(id))) {
          throw new Error(
            "Conflict error. Checkout order already has a settled payment",
          );
        }
        let existingInvoices: IInvoice[] | undefined;
        if (paymentLinks.length) {
          const intentIds = [
            ...new Set(
              paymentLinks.map(
                (link: { billingModulePaymentIntentId: string }) =>
                  link.billingModulePaymentIntentId,
              ),
            ),
          ];
          const intents: IPaymentIntent[] =
            await billingModule.paymentIntent.find({
              params: {
                filters: {
                  and: [{ column: "id", method: "inArray", value: intentIds }],
                },
              },
            });
          const invoiceLinks =
            await billingModule.paymentIntentsToInvoices.find({
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
            invoices = await billingModule.invoice.find({
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
          const openInvoices = invoices.filter((invoice) =>
            ["open", "draft"].includes(invoice.status),
          );
          const unresolvedIntentIds = intentIds.filter((id) => {
            const intent = intents.find((entry) => entry.id === id);
            return !intent || !["failed", "canceled"].includes(intent.status);
          });
          if (openInvoices.length || unresolvedIntentIds.length) {
            const [invoice] = openInvoices;
            if (
              openInvoices.length !== 1 ||
              !invoice.paymentUrl ||
              intents.length !== intentIds.length ||
              !(await this.invoiceCoversSelection(
                invoice.id,
                orderIds,
                unresolvedIntentIds,
              ))
            ) {
              throw new Error(
                "Conflict error. Cart has an unresolved payment attempt",
              );
            }
            existingInvoices = [invoice];
          }
        }
        if (props.expectedLines) {
          const lines = await ecommerceModule.ordersToProducts.find({
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
            await ecommerceModule.ordersToBillingModuleCurrencies.find({
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
        for (const order of lockedOrders) {
          await ecommerceModule.order.update({
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
        return { invoices: existingInvoices };
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

  private async invoiceCoversSelection(
    invoiceId: string,
    orderIds: string[],
    unresolvedIntentIds: string[],
  ): Promise<boolean> {
    const { ecommerceModule, billingModule } = this.dependencies;
    // Follow the invoice back to every intent and order it will settle.
    // The forward lookup only sees links for orders selected in the cart.
    const intentLinks: IIntentInvoice[] =
      await billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [{ column: "invoiceId", method: "eq", value: invoiceId }],
          },
        },
      });
    const invoiceIntents = new Set(
      intentLinks.map((link) => link.paymentIntentId),
    );
    if (
      !invoiceIntents.size ||
      invoiceIntents.size !== unresolvedIntentIds.length ||
      !unresolvedIntentIds.every((id) => invoiceIntents.has(id))
    ) {
      return false;
    }

    const orderLinks: IOrderIntent[] =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "inArray",
                value: [...invoiceIntents],
              },
            ],
          },
        },
      });
    const invoiceOrders = new Set(orderLinks.map((link) => link.orderId));
    const linkedIntents = new Set(
      orderLinks.map((link) => link.billingModulePaymentIntentId),
    );
    return (
      linkedIntents.size === invoiceIntents.size &&
      invoiceOrders.size === orderIds.length &&
      orderIds.every((id) => invoiceOrders.has(id))
    );
  }
}

import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { Service as SubjectService } from "../../index";
import type { Repository } from "../../../../repository";
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
        const paymentLinks =
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
          const intents = await billingModule.paymentIntent.find({
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
          const allFailed = intentIds.every((id) =>
            intents.some(
              (intent: { id: string; status: string }) =>
                intent.id === id &&
                ["failed", "canceled"].includes(intent.status),
            ),
          );
          if (openInvoices.length || !allFailed) {
            if (
              orderIds.length !== 1 ||
              !openInvoices.some((invoice) => Boolean(invoice.paymentUrl))
            ) {
              throw new Error(
                "Conflict error. Cart has an unresolved payment attempt",
              );
            }
            existingInvoices = openInvoices.filter((invoice) =>
              Boolean(invoice.paymentUrl),
            );
          }
        }
        if (props.expectedLines) {
          const lines = await ecommerceModule.ordersToProducts.find({
            params: { filters },
          });
          const snapshot = (rows: ILineSnapshot[]) =>
            rows
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
          if (snapshot(lines) !== snapshot(props.expectedLines)) {
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
          const snapshot = (rows: ICurrencySnapshot[]) =>
            rows
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
          if (snapshot(currencies) !== snapshot(props.expectedCurrencies)) {
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
}

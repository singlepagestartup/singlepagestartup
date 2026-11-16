import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOrderIntent } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { IModel as IIntentInvoice } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import type { IReadService } from "../../../../di";

export interface IExecuteProps {
  orders: Pick<
    IOrder,
    | "id"
    | "type"
    | "status"
    | "subscriptionPeriodInvoiceId"
    | "subscriptionPeriodStartsAt"
    | "subscriptionPeriodEndsAt"
  >[];
}

interface IConstructorProps {
  ecommerceModule: {
    ordersToBillingModulePaymentIntents: Pick<IReadService, "find">;
  };
  billingModule: Record<
    "paymentIntent" | "paymentIntentsToInvoices" | "invoice",
    Pick<IReadService, "find">
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute({ orders }: IExecuteProps): Promise<Set<string>> {
    const retryable = new Set(
      orders
        .filter(
          (order) =>
            order.type === "history" &&
            ["paying", "canceling", "canceled", "failed"].includes(
              order.status,
            ) &&
            !order.subscriptionPeriodInvoiceId &&
            !order.subscriptionPeriodStartsAt &&
            !order.subscriptionPeriodEndsAt,
        )
        .map((order) => order.id),
    );
    const settled = await this.settledIds({ orderIds: [...retryable] });
    for (const id of settled) {
      retryable.delete(id);
    }
    return retryable;
  }

  async settledIds({ orderIds }: { orderIds: string[] }): Promise<Set<string>> {
    const settled = new Set<string>();
    if (!orderIds.length) {
      return settled;
    }
    const { ecommerceModule, billingModule } = this.dependencies;
    const orderIntents: IOrderIntent[] =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "inArray", value: orderIds }],
          },
        },
      });
    if (!orderIntents.length) {
      return settled;
    }

    // Billing can record the payment before the order check advances its status.
    const intentIds = [
      ...new Set(orderIntents.map((link) => link.billingModulePaymentIntentId)),
    ];
    const [succeededIntents, invoiceLinks]: [
      { id: string }[],
      IIntentInvoice[],
    ] = await Promise.all([
      billingModule.paymentIntent.find({
        params: {
          filters: {
            and: [
              { column: "id", method: "inArray", value: intentIds },
              { column: "status", method: "eq", value: "succeeded" },
            ],
          },
        },
      }),
      billingModule.paymentIntentsToInvoices.find({
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
    ]);
    const settledIntentIds = new Set(
      succeededIntents.map((intent) => intent.id),
    );
    if (invoiceLinks.length) {
      const invoiceIds = [
        ...new Set(invoiceLinks.map((link) => link.invoiceId)),
      ];
      const paidInvoices: { id: string }[] = await billingModule.invoice.find({
        params: {
          filters: {
            and: [
              { column: "id", method: "inArray", value: invoiceIds },
              { column: "status", method: "eq", value: "paid" },
            ],
          },
        },
      });
      const paidIds = new Set(paidInvoices.map((invoice) => invoice.id));
      for (const link of invoiceLinks) {
        if (paidIds.has(link.invoiceId)) {
          settledIntentIds.add(link.paymentIntentId);
        }
      }
    }
    for (const link of orderIntents) {
      if (settledIntentIds.has(link.billingModulePaymentIntentId)) {
        settled.add(link.orderId);
      }
    }
    return settled;
  }
}

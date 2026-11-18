import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOrderIntent } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { IModel as IIntentInvoice } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import type { IModel as IPaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import type { IReadService } from "../../../../di";
import type { Service as SubjectsToOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import type { SubjectServiceDependencies } from "../../index";

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

interface IConstructorProps extends SubjectServiceDependencies {
  subjectsToEcommerceModuleOrders: Pick<SubjectsToOrdersService, "find">;
  ecommerceModule: {
    ordersToBillingModulePaymentIntents: Pick<IReadService, "find">;
  };
  billingModule: Record<
    "paymentIntent" | "paymentIntentsToInvoices" | "invoice",
    Pick<IReadService, "find">
  >;
}

interface IBillingRecords {
  orderIntents: IOrderIntent[];
  intents: IPaymentIntent[];
  invoiceLinks: IIntentInvoice[];
  invoices: IInvoice[];
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async settledIds({ orderIds }: { orderIds: string[] }): Promise<Set<string>> {
    const records = await this.billingRecords(orderIds);
    return this.settledOrderIds(records);
  }

  async execute(props: IExecuteProps): Promise<Set<string>> {
    const ids = this.unfinishedOrders(props).map((order) => order.id);
    const settled = await this.settledIds({ orderIds: ids });
    return new Set(ids.filter((id) => !settled.has(id)));
  }

  async purchasePayments(props: IExecuteProps & { subjectId: string }) {
    const orders = this.unfinishedOrders(props);
    const records = await this.billingRecords(orders.map((order) => order.id));
    const settled = this.settledOrderIds(records);
    const retryableIds = new Set(
      orders.filter((order) => !settled.has(order.id)).map((order) => order.id),
    );
    const pendingIds = new Set(
      orders
        .filter(
          (order) => order.status === "paying" && retryableIds.has(order.id),
        )
        .map((order) => order.id),
    );
    const paymentUrls = await this.openPaymentUrls(
      records,
      pendingIds,
      props.subjectId,
    );
    return { retryableIds, paymentUrls };
  }

  private filterByIds(column: string, ids: string[]) {
    return {
      params: {
        filters: {
          and: [
            { column, method: "inArray" as const, value: [...new Set(ids)] },
          ],
        },
      },
    };
  }

  private unfinishedOrders({ orders }: IExecuteProps) {
    return orders.filter(
      (order) =>
        order.type === "history" &&
        ["paying", "canceling", "canceled", "failed"].includes(order.status) &&
        !order.subscriptionPeriodInvoiceId &&
        !order.subscriptionPeriodStartsAt &&
        !order.subscriptionPeriodEndsAt,
    );
  }

  private settledOrderIds(records: IBillingRecords) {
    // Billing may settle before the order status advances.
    const paid = new Set(
      records.invoices
        .filter((invoice) => invoice.status === "paid")
        .map((invoice) => invoice.id),
    );
    const settled = new Set(
      records.intents
        .filter((intent) => intent.status === "succeeded")
        .map((intent) => intent.id),
    );
    for (const link of records.invoiceLinks) {
      if (paid.has(link.invoiceId)) {
        settled.add(link.paymentIntentId);
      }
    }
    return new Set(
      records.orderIntents
        .filter((link) => settled.has(link.billingModulePaymentIntentId))
        .map((link) => link.orderId),
    );
  }

  private async billingRecords(orderIds: string[]): Promise<IBillingRecords> {
    const records: IBillingRecords = {
      orderIntents: [],
      intents: [],
      invoiceLinks: [],
      invoices: [],
    };
    if (!orderIds.length) {
      return records;
    }
    const { ecommerceModule, billingModule } = this.dependencies;
    records.orderIntents =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find(
        this.filterByIds("orderId", orderIds),
      );
    if (!records.orderIntents.length) {
      return records;
    }
    const intentIds = records.orderIntents.map(
      (link) => link.billingModulePaymentIntentId,
    );
    [records.intents, records.invoiceLinks] = await Promise.all([
      billingModule.paymentIntent.find(this.filterByIds("id", intentIds)),
      billingModule.paymentIntentsToInvoices.find(
        this.filterByIds("paymentIntentId", intentIds),
      ),
    ]);
    if (records.invoiceLinks.length) {
      records.invoices = await billingModule.invoice.find(
        this.filterByIds(
          "id",
          records.invoiceLinks.map((link) => link.invoiceId),
        ),
      );
    }
    return records;
  }

  private async openPaymentUrls(
    records: IBillingRecords,
    pendingIds: Set<string>,
    subjectId: string,
  ) {
    const paymentUrls = new Map<string, string>();
    const open = records.invoices.filter(
      (invoice) =>
        invoice.status === "open" &&
        Boolean(invoice.provider) &&
        invoice.provider !== "dummy" &&
        URL.canParse(invoice.paymentUrl) &&
        /^https?:\/\//i.test(invoice.paymentUrl),
    );
    if (!pendingIds.size || !open.length) {
      return paymentUrls;
    }

    // A single invoice may charge several orders. Follow every link back to its owner
    // before exposing the provider URL, including links outside the history response.
    const { billingModule, ecommerceModule } = this.dependencies;
    const invoiceIntents: IIntentInvoice[] =
      await billingModule.paymentIntentsToInvoices.find(
        this.filterByIds(
          "invoiceId",
          open.map((invoice) => invoice.id),
        ),
      );
    const actionable = new Set(
      records.intents
        .filter((intent) =>
          [
            "requires_payment_method",
            "requires_action",
            "requires_confirmation",
          ].includes(intent.status),
        )
        .map((intent) => intent.id),
    );
    const intentIds = invoiceIntents.map((link) => link.paymentIntentId);
    if (!intentIds.length) {
      return paymentUrls;
    }
    const linkedOrders: IOrderIntent[] =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find(
        this.filterByIds("billingModulePaymentIntentId", intentIds),
      );
    const orderIds = linkedOrders.map((link) => link.orderId);
    if (!orderIds.length) {
      return paymentUrls;
    }
    const ownership =
      await this.dependencies.subjectsToEcommerceModuleOrders.find(
        this.filterByIds("ecommerceModuleOrderId", orderIds),
      );
    const exclusive = new Set(
      ownership
        .filter((link) => link.subjectId === subjectId)
        .map((link) => link.ecommerceModuleOrderId),
    );
    for (const link of ownership) {
      if (link.subjectId !== subjectId) {
        exclusive.delete(link.ecommerceModuleOrderId);
      }
    }

    const ordersByIntent = new Map<string, string[]>();
    for (const link of linkedOrders) {
      const ids = ordersByIntent.get(link.billingModulePaymentIntentId) ?? [];
      ids.push(link.orderId);
      ordersByIntent.set(link.billingModulePaymentIntentId, ids);
    }
    const intentsByInvoice = new Map<string, string[]>();
    for (const link of invoiceIntents) {
      const ids = intentsByInvoice.get(link.invoiceId) ?? [];
      ids.push(link.paymentIntentId);
      intentsByInvoice.set(link.invoiceId, ids);
    }
    const ambiguous = new Set<string>();
    for (const invoice of open) {
      const intents = intentsByInvoice.get(invoice.id) ?? [];
      const coveredOrders = new Set(
        intents.flatMap((id) => ordersByIntent.get(id) ?? []),
      );
      const canPay =
        intents.every((id) => actionable.has(id) && ordersByIntent.has(id)) &&
        [...coveredOrders].every(
          (id) => pendingIds.has(id) && exclusive.has(id),
        );
      if (!canPay) {
        continue;
      }
      for (const id of coveredOrders) {
        if (paymentUrls.has(id)) {
          ambiguous.add(id);
        }
        paymentUrls.set(id, invoice.paymentUrl);
      }
    }
    for (const id of ambiguous) {
      paymentUrls.delete(id);
    }
    return paymentUrls;
  }
}

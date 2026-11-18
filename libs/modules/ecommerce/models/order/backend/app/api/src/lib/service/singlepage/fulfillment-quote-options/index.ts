import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { Service as OrderService } from "../index";

export interface IConstructorProps {
  findById: (props: { id: string }) => Promise<IOrder | null>;
  ordersToProducts: Pick<OrderService["ordersToProducts"], "find">;
  payments: Pick<OrderService["ordersToBillingModulePaymentIntents"], "find">;
  billingModule: Pick<
    OrderService["billingModule"],
    "paymentIntent" | "invoice" | "paymentIntentsToInvoices"
  >;
}

export interface IResult {
  fulfilledLineIds: string[];
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: { id: string }): Promise<IResult> {
    const { findById, ordersToProducts, payments, billingModule } =
      this.dependencies;
    const order = await findById(props);
    if (!order) {
      return { fulfilledLineIds: [] };
    }
    let sourceId = order.subscriptionSourceOrderId;
    let invoiceId = order.subscriptionSourceInvoiceId;
    if (order.type === "history") {
      sourceId = order.id;
      invoiceId = order.subscriptionPeriodInvoiceId;
    }
    if (!sourceId || !invoiceId) {
      return { fulfilledLineIds: [] };
    }
    const lines = await ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: order.id }],
        },
      },
    });
    const primary = lines.filter((line) => !line.parentLineId);
    if (primary.length !== 1 || !primary[0].offerId) {
      return { fulfilledLineIds: [] };
    }
    const visited = new Set<string>();
    while (sourceId && invoiceId && !visited.has(sourceId)) {
      visited.add(sourceId);
      const source = await findById({ id: sourceId });
      if (
        !source ||
        source.type !== "history" ||
        source.subscriptionRevokedAt ||
        source.subscriptionPeriodInvoiceId !== invoiceId
      ) {
        break;
      }
      const [paymentLinks, invoiceLinks, invoice] = await Promise.all([
        payments.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: source.id }],
            },
          },
        }),
        billingModule.paymentIntentsToInvoices.find({
          params: {
            filters: {
              and: [{ column: "invoiceId", method: "eq", value: invoiceId }],
            },
          },
        }),
        billingModule.invoice.findById({ id: invoiceId }),
      ]);
      const intentIds = [
        ...new Set(
          invoiceLinks
            .map((link) => link.paymentIntentId)
            .filter((id) =>
              paymentLinks.some(
                (link) => link.billingModulePaymentIntentId === id,
              ),
            ),
        ),
      ];
      if (intentIds.length !== 1 || invoice?.status !== "paid") {
        break;
      }
      const intent = await billingModule.paymentIntent.findById({
        id: intentIds[0],
      });
      if (intent?.type !== "one_off" || intent.status !== "succeeded") {
        break;
      }
      const snapshots = paymentLinks
        .filter(
          (link) =>
            link.billingModulePaymentIntentId === intent.id &&
            link.purchaseSnapshot,
        )
        .map((link) => link.purchaseSnapshot!);
      const mains = snapshots.filter(
        (snapshot) => snapshot.charge.role === "product",
      );
      if (
        mains.length !== 1 ||
        mains[0].purchaseType !== "subscription" ||
        mains[0].charge.productId !== primary[0].productId
      ) {
        break;
      }
      const delivery = snapshots.filter(
        (snapshot) => snapshot.charge.role === "delivery",
      );
      if (delivery.some((snapshot) => snapshot.charge.recurrence === "each")) {
        break;
      }
      if (delivery.some((snapshot) => snapshot.charge.recurrence === "first")) {
        return { fulfilledLineIds: [primary[0].id] };
      }
      sourceId = source.subscriptionSourceOrderId;
      invoiceId = source.subscriptionSourceInvoiceId;
    }
    return { fulfilledLineIds: [] };
  }
}

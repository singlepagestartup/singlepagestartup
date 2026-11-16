import type { Service as SubjectService } from "../../index";
import { Service as PaymentPurchaser } from "../../../startup/ecommerce/order/payment-purchaser";

export interface IExecuteProps {
  renewalOrderId: string;
  subjectId: string;
  socialModuleProfileId?: string;
  productIds: string[];
}

export interface IContext {
  renewalOrderId: string;
}

export class Service {
  constructor(
    readonly service: Pick<
      SubjectService,
      | "socialModule"
      | "ecommerceModule"
      | "billingModule"
      | "subjectsToBillingModulePaymentIntents"
    >,
  ) {}

  async execute(props: IExecuteProps): Promise<string> {
    const purchaser = await new PaymentPurchaser({
      purchasers: this.service.subjectsToBillingModulePaymentIntents,
      ecommerceModule: this.service.ecommerceModule,
      socialModule: this.service.socialModule,
    }).resolveOrder(props.renewalOrderId);
    if (
      purchaser.subjectId !== props.subjectId ||
      (props.socialModuleProfileId &&
        purchaser.profileId !== props.socialModuleProfileId)
    ) {
      throw new Error(
        "Permission error. Subscription renewal purchaser or profile does not match",
      );
    }
    const order = await this.service.ecommerceModule.order.findById({
      id: props.renewalOrderId,
    });
    if (
      !order ||
      !["completed", "expired"].includes(order.status) ||
      !order.subscriptionPeriodInvoiceId ||
      !order.subscriptionPeriodEndsAt ||
      new Date(order.subscriptionPeriodEndsAt).getTime() > Date.now()
    ) {
      throw new Error(
        "Permission error. Subscription is not ready for renewal",
      );
    }
    const intents =
      await this.service.ecommerceModule.ordersToBillingModulePaymentIntents.find(
        {
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: order.id }],
            },
          },
        },
      );
    const invoiceLinks =
      await this.service.billingModule.paymentIntentsToInvoices.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "inArray",
                value: intents.map((link) => link.billingModulePaymentIntentId),
              },
              {
                column: "invoiceId",
                method: "eq",
                value: order.subscriptionPeriodInvoiceId,
              },
            ],
          },
        },
      });
    if (!invoiceLinks.length) {
      throw new Error(
        "Permission error. Subscription period invoice does not belong to the original payment",
      );
    }
    const invoice = await this.service.billingModule.invoice.findById({
      id: order.subscriptionPeriodInvoiceId,
    });
    if (invoice?.status !== "paid") {
      throw new Error(
        "Permission error. Subscription renewal requires the paid period invoice",
      );
    }
    const attributes =
      await this.service.ecommerceModule.order.findByIdCheckoutAttributes({
        id: order.id,
      });
    if (attributes.type !== "subscription") {
      throw new Error("Permission error. Only a subscription can renew");
    }
    const lines = await this.service.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: order.id }],
        },
      },
    });
    const productIds = [...new Set(lines.map((line) => line.productId))].sort();
    const requestedIds = [...new Set(props.productIds)].sort();
    if (
      !productIds.length ||
      productIds.length !== requestedIds.length ||
      productIds.some((id, index) => id !== requestedIds[index])
    ) {
      throw new Error(
        "Permission error. Subscription renewal products do not match",
      );
    }
    return purchaser.profileId;
  }
}

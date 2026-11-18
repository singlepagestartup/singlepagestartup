import type { Service as StripeOrderPayment } from "./stripe-payment";
import type { Service as PaymentIntent } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";

const initializationGracePeriod = 5 * 60 * 1000;

export class Service {
  constructor(
    private readonly service: PaymentIntent,
    private readonly stripePayment: Pick<StripeOrderPayment, "check">,
  ) {}

  async execute(id: string) {
    const entity = await this.service.findById({ id });
    if (!entity) {
      throw new Error("Not Found error. Not found");
    }

    if (["succeeded", "failed", "canceled"].includes(entity.status)) {
      return entity;
    }

    const paymentIntentsToInvoices =
      await this.service.billingModule.paymentIntentsToInvoices.find({
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

    if (!paymentIntentsToInvoices?.length) {
      const updatedAt = new Date(
        entity.updatedAt ?? entity.createdAt,
      ).getTime();
      const initializationExpired =
        updatedAt < Date.now() - initializationGracePeriod;

      if (initializationExpired) {
        const failedEntity = await this.service.failUninitializedPaymentIntent(
          entity.id,
          new Date(Date.now() - initializationGracePeriod),
        );

        return failedEntity;
      }

      return entity;
    }

    const invoiceIds = paymentIntentsToInvoices.map((link) => link.invoiceId);
    const invoices = await this.service.billingModule.invoice.find({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: invoiceIds }],
        },
      },
    });

    const expiresBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const invoice of invoices) {
      if (invoice.provider === "stripe") {
        await this.stripePayment.check(invoice);
      } else if (invoice.provider === "cloudpayments") {
        await this.service.checkCloudpaymentsInvoice(invoice);
      } else if (new Date(invoice.createdAt) < expiresBefore) {
        await this.service.expireInvoice({
          invoiceId: invoice.id,
          provider: invoice.provider,
          expiresBefore,
        });
      }
    }
    const currentIntent = await this.service.findById({ id: entity.id });
    return currentIntent;
  }
}

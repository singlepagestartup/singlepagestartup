import { Service as PaymentIntent } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import type { Repository } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/repository";
import type {
  IExecuteProps,
  IExpireProps,
} from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/settlement";
import type { Service as Reservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export class Service extends PaymentIntent {
  protected override readonly usesPreparedCheckoutInvoice = true;

  constructor(
    repository: Repository,
    private readonly reservations: Reservations,
  ) {
    super(repository);
  }

  override settlePayment(props: IExecuteProps) {
    const settlement = this.settlement;
    return settlement.withInvoice(props, async (invoice, intents) => {
      settlement.validate(props, invoice, intents);
      const paymentIntentIds = intents.map((intent) => intent.id);
      const canceled = settlement.isCanceled(invoice, intents);
      if (
        canceled &&
        !(await this.reservations.canRecordLatePayment({ paymentIntentIds }))
      ) {
        throw new Error("Conflict error. Payment was canceled");
      }
      const fulfillment = await this.reservations.settleReservations({
        paymentIntentIds,
        requiresReconciliation: canceled,
      });
      return settlement.record(
        props,
        invoice,
        intents,
        new Set(fulfillment.reconciliationPaymentIntentIds),
      );
    });
  }

  override async expireInvoice(props: IExpireProps) {
    const settlement = this.settlement;
    await settlement.withInvoice(props, async (invoice, intents) => {
      const paymentIntentIds = await settlement.markExpired(
        props,
        invoice,
        intents,
      );
      if (paymentIntentIds.length) {
        await this.reservations.releaseReservations({ paymentIntentIds });
      }
    });
  }

  override async failUnpaidIntent(id: string, expectedStatus: string) {
    await this.repository.withPaymentIntentLock(id, async () => {
      if (await this.markUnpaidIntentFailed(id, expectedStatus)) {
        await this.reservations.releaseReservations({ paymentIntentIds: [id] });
      }
    });
  }
}

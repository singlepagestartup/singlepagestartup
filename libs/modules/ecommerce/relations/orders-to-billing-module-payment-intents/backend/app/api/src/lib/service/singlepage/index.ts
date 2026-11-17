import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import {
  Repository,
  type IReservedOfferQuantitiesProps,
} from "../../repository";
import { Service as Reservation } from "../startup/reservation";
import type { IReservationLine } from "./reservation";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  reservedQuantities(props: Omit<IReservedOfferQuantitiesProps, "database">) {
    return this.repository.reservedQuantities(props);
  }

  lockOffers(props: { offerIds: string[] }) {
    return this.repository.lockOffers(props);
  }

  withOfferLocks<T>(
    props: { offerIds: string[] },
    operation: () => Promise<T>,
  ) {
    return this.repository.withOfferLocks(props, operation);
  }

  reserveCharges(props: {
    paymentIntentId: string;
    lines: IReservationLine[];
  }) {
    return new Reservation({
      repository: this.repository,
      service: this,
    }).reserve(props);
  }

  settleReservations(props: {
    paymentIntentIds: string[];
    requiresReconciliation?: boolean;
  }) {
    return new Reservation({
      repository: this.repository,
      service: this,
    }).settle(props);
  }

  async canRecordLatePayment(props: { paymentIntentIds: string[] }) {
    const rows = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "billingModulePaymentIntentId",
              method: "inArray",
              value: props.paymentIntentIds,
            },
          ],
        },
      },
    });
    return (
      props.paymentIntentIds.length > 0 &&
      props.paymentIntentIds.every((id) =>
        rows.some(
          (row) =>
            row.billingModulePaymentIntentId === id &&
            row.purchaseSnapshot &&
            ["held", "released", "reconciliation"].includes(
              row.reservationStatus,
            ),
        ),
      )
    );
  }

  releaseReservations(props: { paymentIntentIds: string[] }) {
    return new Reservation({
      repository: this.repository,
      service: this,
    }).release(props);
  }
}

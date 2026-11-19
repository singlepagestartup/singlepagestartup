import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import type { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Repository } from "../../repository";
import { OrdersToBillingModulePaymentIntentsDI } from "../../di";
import { Service as Reservation } from "../startup/reservation";
import type { IReservationLine } from "./reservation";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  constructor(
    @inject(DI.IRepository) readonly repository: Repository,
    @inject(OrdersToBillingModulePaymentIntentsDI.IAttributeService)
    readonly attribute: Pick<AttributeService, "update">,
  ) {
    super(repository);
  }

  async stockForOffers(offerIds: string[]) {
    const rows = await this.repository.stockRowsForOffers(
      offerIds,
      "stock_quantity",
    );
    const result = new Map<string, { attributeId: string; quantity: number }>();
    for (const row of rows) {
      if (
        result.has(row.offerId) ||
        row.number === null ||
        !/^\d+(?:\.0+)?$/.test(row.number) ||
        !Number.isSafeInteger(Number(row.number))
      ) {
        throw new Error(
          "Configuration error. Reserved offer stock is invalid or ambiguous",
        );
      }
      result.set(row.offerId, {
        attributeId: row.attributeId,
        quantity: Number(row.number),
      });
    }
    return result;
  }

  private async writeStock(attributeId: string, quantity: number) {
    const attribute = await this.attribute.update({
      id: attributeId,
      data: { number: String(quantity) },
    });
    if (!attribute) {
      throw new Error("Not Found error. A reserved stock attribute is missing");
    }
  }

  async reservedQuantities(props: {
    offerIds: string[];
    excludePaymentIntentId?: string;
  }): Promise<Record<string, number>> {
    const quantities: Record<string, number> = Object.fromEntries(
      props.offerIds.map((id) => [id, 0]),
    );
    if (!props.offerIds.length) {
      return quantities;
    }
    const rows = await this.find({
      params: {
        filters: {
          and: [
            { column: "offerId", method: "inArray", value: props.offerIds },
            {
              column: "reservationStatus",
              method: "inArray",
              value: ["held", "reconciliation"],
            },
            ...(props.excludePaymentIntentId
              ? [
                  {
                    column: "billingModulePaymentIntentId",
                    method: "ne" as const,
                    value: props.excludePaymentIntentId,
                  },
                ]
              : []),
          ],
        },
      },
    });
    for (const row of rows) {
      if (row.offerId) {
        quantities[row.offerId] += Math.max(0, row.reservationQuantity);
      }
    }
    return quantities;
  }

  private reservation() {
    return new Reservation({
      repository: this.repository,
      service: {
        find: (props) => this.find(props),
        create: (props) => this.create(props),
        update: (props) => this.update(props),
        stockForOffers: (offerIds) => this.stockForOffers(offerIds),
        reservedQuantities: (props) => this.reservedQuantities(props),
        writeStock: (attributeId, quantity) =>
          this.writeStock(attributeId, quantity),
      },
    });
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
    return this.reservation().reserve(props);
  }

  settleReservations(props: {
    paymentIntentIds: string[];
    requiresReconciliation?: boolean;
  }) {
    return this.reservation().settle(props);
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
    return this.reservation().release(props);
  }
}

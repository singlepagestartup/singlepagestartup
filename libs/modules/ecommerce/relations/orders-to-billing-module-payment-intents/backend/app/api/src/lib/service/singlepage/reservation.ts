import type { IPurchaseSnapshot } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import type { Service as PaymentRelationService } from "./index";
import type { Repository } from "../../repository";
import { isDeepStrictEqual } from "node:util";

export interface IReservationLine {
  orderId: string;
  orderLineId: string;
  offerId: string;
  quantity: number;
  snapshot: IPurchaseSnapshot;
}

interface IConstructorProps {
  repository: Repository;
  service: Pick<PaymentRelationService, "find" | "create" | "update">;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async reserve(props: { paymentIntentId: string; lines: IReservationLine[] }) {
    const { repository, service } = this.dependencies;
    const offerIds = props.lines.map((line) => line.offerId);
    await repository.lockOffers({ offerIds });
    const existing = await service.find({
      params: {
        filters: {
          and: [
            {
              column: "billingModulePaymentIntentId",
              method: "eq",
              value: props.paymentIntentId,
            },
          ],
        },
      },
    });
    const quantities = new Map<string, number>();
    const lineIds = new Set<string>();
    for (const line of props.lines) {
      if (
        lineIds.has(line.orderLineId) ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1
      ) {
        throw new Error(
          "Validation error. Reservation requires distinct lines and positive quantities",
        );
      }
      lineIds.add(line.orderLineId);
      const previous = existing.find(
        (row) => row.orderLineId === line.orderLineId,
      );
      if (previous) {
        if (
          previous.reservationStatus !== "held" ||
          previous.offerId !== line.offerId ||
          previous.reservationQuantity !== line.quantity ||
          !isDeepStrictEqual(
            previous.purchaseSnapshot,
            JSON.parse(JSON.stringify(line.snapshot)),
          )
        ) {
          throw new Error(
            "Conflict error. Payment attempt already has a different reservation",
          );
        }
        continue;
      }
      const expiresAt = new Date(line.snapshot.quoteExpiresAt).getTime();
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        throw new Error(
          "Conflict error. Purchase quote expired before reservation",
        );
      }
      quantities.set(
        line.offerId,
        (quantities.get(line.offerId) ?? 0) + line.quantity,
      );
    }
    const [stock, held] = await Promise.all([
      repository.stockForOffers(offerIds),
      repository.reservedQuantities({ offerIds }),
    ]);
    for (const [offerId, quantity] of quantities) {
      const limit = stock.get(offerId);
      const available = limit
        ? Math.max(0, limit.quantity - held[offerId])
        : null;
      if (available !== null && quantity > available) {
        const line = props.lines.find((entry) => entry.offerId === offerId)!;
        throw new Error(
          `Conflict error. Stock unavailable: ${JSON.stringify({ offerId, lineId: line.orderLineId, requested: quantity, available })}`,
        );
      }
    }
    for (const line of props.lines) {
      if (existing.some((row) => row.orderLineId === line.orderLineId)) {
        continue;
      }
      await service.create({
        data: {
          orderId: line.orderId,
          billingModulePaymentIntentId: props.paymentIntentId,
          orderLineId: line.orderLineId,
          offerId: line.offerId,
          reservationQuantity: line.quantity,
          reservationStatus: "held",
          purchaseSnapshot: line.snapshot,
        },
      });
    }
  }

  async settle(props: {
    paymentIntentIds: string[];
    requiresReconciliation?: boolean;
  }): Promise<{ reconciliationPaymentIntentIds: string[] }> {
    const { repository, service } = this.dependencies;
    const rows = await service.find({
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
    const reservations = rows.filter(
      (row) =>
        row.purchaseSnapshot &&
        row.offerId &&
        row.orderLineId &&
        row.reservationStatus !== "consumed",
    );
    if (!reservations.length) {
      return { reconciliationPaymentIntentIds: [] };
    }
    await repository.lockOffers({
      offerIds: reservations.map((row) => row.offerId!),
    });
    const current = await service.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: reservations.map((row) => row.id),
            },
          ],
        },
      },
    });
    const remaining = current.filter(
      (row) => row.reservationStatus !== "consumed",
    );
    const quantities = new Map<string, number>();
    const ownHeld = new Map<string, number>();
    for (const row of remaining) {
      quantities.set(
        row.offerId!,
        (quantities.get(row.offerId!) ?? 0) + row.reservationQuantity,
      );
      if (["held", "reconciliation"].includes(row.reservationStatus)) {
        ownHeld.set(
          row.offerId!,
          (ownHeld.get(row.offerId!) ?? 0) + row.reservationQuantity,
        );
      }
    }
    const offerIds = [...quantities.keys()];
    const [stock, held] = await Promise.all([
      repository.stockForOffers(offerIds),
      repository.reservedQuantities({ offerIds }),
    ]);
    const unavailable =
      props.requiresReconciliation ||
      remaining.some((row) => row.reservationStatus === "reconciliation") ||
      offerIds.some((id) => {
        const limit = stock.get(id);
        return (
          limit &&
          quantities.get(id)! >
            limit.quantity - held[id] + (ownHeld.get(id) ?? 0)
        );
      });
    if (unavailable) {
      for (const row of remaining) {
        if (row.reservationStatus !== "reconciliation") {
          await service.update({
            id: row.id,
            data: { ...row, reservationStatus: "reconciliation" },
          });
        }
      }
      return {
        reconciliationPaymentIntentIds: [
          ...new Set(remaining.map((row) => row.billingModulePaymentIntentId)),
        ],
      };
    }
    // Remove this attempt from active holds before the owning stock guard checks
    // the remaining stock against reservations belonging to other attempts.
    for (const row of remaining) {
      await service.update({
        id: row.id,
        data: { ...row, reservationStatus: "consumed" },
      });
    }
    for (const [offerId, quantity] of quantities) {
      const limit = stock.get(offerId);
      if (limit) {
        await repository.writeStock(
          limit.attributeId,
          limit.quantity - quantity,
        );
      }
    }
    return { reconciliationPaymentIntentIds: [] };
  }

  async release(props: { paymentIntentIds: string[] }) {
    const { repository, service } = this.dependencies;
    const rows = await service.find({
      params: {
        filters: {
          and: [
            {
              column: "billingModulePaymentIntentId",
              method: "inArray",
              value: props.paymentIntentIds,
            },
            { column: "reservationStatus", method: "eq", value: "held" },
          ],
        },
      },
    });
    await repository.lockOffers({
      offerIds: rows.flatMap((row) => row.offerId ?? []),
    });
    for (const row of rows) {
      const [current] = await service.find({
        params: {
          filters: { and: [{ column: "id", method: "eq", value: row.id }] },
        },
      });
      if (current?.reservationStatus === "held") {
        await service.update({
          id: row.id,
          data: { ...row, reservationStatus: "released" },
        });
      }
    }
  }
}

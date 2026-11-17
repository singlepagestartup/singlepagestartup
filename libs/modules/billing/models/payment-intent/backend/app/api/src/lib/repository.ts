import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
  trackRepositoryRead,
  type IRepository,
} from "@sps/shared-backend-api";
import { asc, inArray } from "drizzle-orm";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import { moneyNumber } from "@sps/backend-utils";
import { isDeepStrictEqual } from "node:util";

export interface IPrepareCheckoutDispatch {
  id: string;
  provider: string;
  currencyId: string;
  metadata: Record<string, unknown>;
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  private get managedCheckoutFields() {
    return [
      "checkoutProvider",
      "checkoutCurrencyId",
      "checkoutMetadata",
      "checkoutDispatchState",
      "checkoutDispatchStartedAt",
    ] as const;
  }

  private writableData(
    data: Record<string, unknown>,
    record?: typeof Table.$inferSelect,
  ) {
    const writable = { ...data };
    for (const field of this.managedCheckoutFields) {
      if (!(field in writable)) {
        continue;
      }
      const supplied = writable[field];
      let persisted: unknown = record?.[field] ?? null;
      if (field === "checkoutDispatchState" && !record) {
        persisted = "legacy";
      }
      let equal = supplied === persisted;
      if (field === "checkoutMetadata") {
        equal = isDeepStrictEqual(supplied, persisted);
      } else if (
        field === "checkoutDispatchStartedAt" &&
        supplied &&
        persisted
      ) {
        equal =
          new Date(supplied as string).getTime() ===
          new Date(persisted as string).getTime();
      }
      if (supplied !== undefined && !equal) {
        throw new Error(
          "Validation error. Checkout dispatch fields are server managed",
        );
      }
      delete writable[field];
    }
    if (writable.amount !== undefined) {
      writable.amount = moneyNumber(writable.amount as string | number);
      if (
        record &&
        ["prepared", "dispatching", "exposed"].includes(
          record.checkoutDispatchState,
        ) &&
        writable.amount !== record.amount
      ) {
        throw new Error(
          "Conflict error. Prepared checkout amount is immutable",
        );
      }
    }
    return writable;
  }

  override insert(data: Record<string, unknown>) {
    return super.insert(this.writableData(data));
  }

  override async updateFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
  ) {
    const record = await this.findFirstByField(field, value);
    const writable = this.writableData(data, record);
    return super.updateFirstByField(field, value, writable);
  }

  override async consumeFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
    predicate?: Parameters<IRepository["consumeFirstByField"]>[3],
  ) {
    const record = await this.findFirstByField(field, value);
    return super.consumeFirstByField(
      field,
      value,
      this.writableData(data, record),
      predicate,
    );
  }

  prepareCheckoutDispatch(props: IPrepareCheckoutDispatch) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Preparing payment dispatch requires an owner transaction",
      );
    }
    return super.consumeFirstByField(
      "id",
      props.id,
      {
        checkoutProvider: props.provider,
        checkoutCurrencyId: props.currencyId,
        checkoutMetadata: props.metadata,
        checkoutDispatchState: "prepared",
      },
      {
        and: [
          { column: "checkoutDispatchState", method: "eq", value: "legacy" },
          { column: "status", method: "eq", value: "requires_payment_method" },
        ],
      },
    );
  }

  claimCheckoutDispatch(props: { id: string; provider: string }) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Claiming payment dispatch requires an owner transaction",
      );
    }
    return super.consumeFirstByField(
      "id",
      props.id,
      {
        checkoutDispatchState: "dispatching",
        checkoutDispatchStartedAt: new Date(),
      },
      {
        and: [
          { column: "checkoutDispatchState", method: "eq", value: "prepared" },
          { column: "checkoutProvider", method: "eq", value: props.provider },
          { column: "status", method: "eq", value: "requires_payment_method" },
        ],
      },
    );
  }

  markCheckoutExposed(id: string) {
    return super.consumeFirstByField(
      "id",
      id,
      { checkoutDispatchState: "exposed" },
      {
        and: [
          {
            column: "checkoutDispatchState",
            method: "eq",
            value: "dispatching",
          },
        ],
      },
    );
  }

  withPaymentIntentLock<T>(
    id: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return this.withPaymentIntentLocks([id], operation);
  }

  withPaymentIntentLocks<T>(
    ids: string[],
    operation: () => Promise<T>,
  ): Promise<T> {
    const orderedIds = [...new Set(ids)].sort();
    if (!orderedIds.length)
      throw new Error("Validation error. Payment intent is required");
    const run = async () => {
      await trackRepositoryRead(Table, this.db, {
        and: [{ column: "id", method: "inArray", value: orderedIds }],
      });
      await this.db
        .select({ id: Table.id })
        .from(Table)
        .where(inArray(Table.id, orderedIds))
        .orderBy(asc(Table.id))
        .for("update");
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }
}

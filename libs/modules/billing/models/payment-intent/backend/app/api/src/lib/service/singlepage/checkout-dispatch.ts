import { consistencyContext } from "@sps/shared-backend-api";
import { parseExactMonetaryAmount } from "@sps/backend-utils";
import {
  privateCheckoutFields,
  type Table,
} from "@sps/billing/models/payment-intent/backend/repository/database";
import { isDeepStrictEqual } from "node:util";
import type { Repository } from "../../repository";

export interface IPrepareCheckoutDispatch {
  id: string;
  provider: string;
  currencyId: string;
  metadata: Record<string, unknown>;
}

export class Service {
  constructor(
    private readonly repository: Pick<Repository, "consumeFirstByField">,
  ) {}

  writableData(
    data: Record<string, unknown>,
    record?: (typeof Table.$inferSelect & Record<string, unknown>) | null,
  ) {
    const writable = { ...data };
    for (const field of privateCheckoutFields) {
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
      writable.amount = parseExactMonetaryAmount(
        writable.amount as string | number,
      );
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

  async prepare(props: IPrepareCheckoutDispatch) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Preparing payment dispatch requires an owner transaction",
      );
    }
    const prepared = await this.repository.consumeFirstByField(
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
    if (!prepared) {
      throw new Error(
        "Conflict error. Payment attempt cannot be prepared for dispatch",
      );
    }
    return prepared;
  }

  claim(props: { id: string; provider: string }) {
    return this.repository.consumeFirstByField(
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

  markExposed(id: string) {
    return this.repository.consumeFirstByField(
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
}

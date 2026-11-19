import Decimal from "decimal.js";
import { z } from "zod";
import type { SubjectServiceDependencies } from "../index";
import type { IModel as IReceipt } from "@sps/rbac/relations/subjects-to-wallet-operations/sdk/model";

const Money = Decimal.clone({ precision: 56 });
const amount = z.string().regex(/^(0|[1-9]\d{0,25})(\.\d{1,12})?$/);
const key = z.string().trim().min(1).max(180);
const operation = z
  .object({
    storeId: z.uuid(),
    taskId: z.uuid(),
    senderId: z.uuid(),
    recipientId: z.uuid(),
    currencyId: z.uuid(),
    actorId: z.uuid(),
    operationKey: key.refine((value) => !value.startsWith("settlement:")),
    purpose: key,
    amount,
  })
  .strict();
type IOperation = z.infer<typeof operation>;
interface IReservation extends IOperation {
  budget: string;
}
interface ISettlement {
  storeId: string;
  reservationKey: string;
  recipientId: string;
  providerSubjectId: string;
  workAmount: string;
  providerAmount: string;
}

export class WorkLedger {
  constructor(
    private readonly subject: SubjectServiceDependencies<"repository">,
  ) {}

  private get records() {
    return this.subject.module.subjectsToWalletOperations;
  }

  private get balances() {
    return this.subject.module.subjectsToBillingModuleCurrencies;
  }

  private walletKey(subjectId: string, currencyId: string) {
    return `balance:${subjectId}:${currencyId}`;
  }

  private positive(input: IOperation) {
    if (
      new Money(input.amount).lte(0) ||
      input.senderId === input.recipientId
    ) {
      throw new Error(
        "Validation error. A positive transfer between different wallets is required",
      );
    }
  }

  private previous(
    row: IReceipt,
    input: IOperation,
    kind: IReceipt["kind"],
    budget?: string,
  ) {
    if (
      row.kind !== kind ||
      row.senderId !== input.senderId ||
      row.recipientId !== input.recipientId ||
      row.currencyId !== input.currencyId ||
      row.actorId !== input.actorId ||
      row.purpose !== input.purpose ||
      row.taskId !== input.taskId ||
      !new Money(row.amount).eq(input.amount) ||
      (budget !== undefined &&
        (!row.budget || !new Money(row.budget).eq(budget)))
    ) {
      throw new Error(
        "Conflict error. The wallet operation key already identifies different terms",
      );
    }
    return row;
  }

  private async fundCheck(input: IOperation, budget?: string) {
    const obligations = await this.records.obligations(
      input.senderId,
      input.currencyId,
      input.storeId,
      input.taskId,
    );
    const total = await this.balances.total(input.senderId, input.currencyId);
    if (new Money(total).minus(obligations.held).lt(input.amount)) {
      throw new Error(
        "Payment required. Insufficient available wallet balance",
      );
    }
    if (
      budget !== undefined &&
      new Money(obligations.committed).plus(input.amount).gt(budget)
    ) {
      throw new Error("Payment required. Task spending limit reached");
    }
  }

  private async post(input: IOperation, reservationId?: string) {
    await this.balances.applyDelta(
      input.senderId,
      input.currencyId,
      new Money(input.amount).negated().toFixed(),
    );
    await this.balances.applyDelta(
      input.recipientId,
      input.currencyId,
      input.amount,
    );
    return this.records.create({
      data: { ...input, kind: "transfer", state: "posted", reservationId },
    });
  }

  private keys(input: IOperation) {
    return [
      this.walletKey(input.senderId, input.currencyId),
      this.walletKey(input.recipientId, input.currencyId),
      `key:${input.storeId}:${input.operationKey}`,
    ];
  }

  async transfer(data: IOperation) {
    const input = operation.parse(data);
    this.positive(input);
    return this.subject.repository.withWalletLocks(
      this.keys(input),
      async () => {
        const prior = await this.records.byKey(
          input.storeId,
          input.operationKey,
        );
        if (prior) {
          return this.previous(prior, input, "transfer");
        }
        await this.fundCheck(input);
        return this.post(input);
      },
    );
  }

  async reserve(data: IReservation) {
    const { budget, ...input } = operation
      .extend({ budget: amount })
      .parse(data);
    this.positive(input);
    return this.subject.repository.withWalletLocks(
      this.keys(input),
      async () => {
        const prior = await this.records.byKey(
          input.storeId,
          input.operationKey,
        );
        if (prior) {
          return this.previous(prior, input, "reserve", budget);
        }
        await this.fundCheck(input, budget);
        return this.records.create({
          data: { ...input, budget, kind: "reserve", state: "held" },
        });
      },
    );
  }

  pendingReconciliations(limit: number, storeId?: string) {
    return this.records.pendingReconciliations(limit, storeId);
  }

  changeProviderWork(
    storeId: string,
    key: string,
    update: (
      previous: IReceipt["providerWork"],
    ) => NonNullable<IReceipt["providerWork"]>,
  ) {
    return this.subject.repository.withWalletLocks(
      [`key:${storeId}:${key}`],
      async () => {
        const row = await this.reservation(storeId, key);
        const next = await this.records.update({
          id: row.id,
          data: {
            providerWork: update(row.providerWork),
            updatedAt: new Date(),
          },
        });
        if (!next) throw new Error("Not found. Work reservation");
        return next;
      },
    );
  }

  async advance(data: IOperation, reservationKey: string) {
    const input = operation.parse(data);
    this.positive(input);
    return this.subject.repository.withWalletLocks(
      [...this.keys(input), `key:${input.storeId}:${reservationKey}`],
      async () => {
        const row = await this.reservation(input.storeId, reservationKey);
        const previous = await this.records.byKey(
          input.storeId,
          input.operationKey,
        );
        if (previous) {
          if (previous.reservationId !== row.id)
            throw new Error("Conflict error. Different advance reservation");
          return this.previous(previous, input, "transfer");
        }
        const advanced = new Money(row.advanceAmount).plus(input.amount);
        if (
          row.state !== "held" ||
          row.senderId !== input.senderId ||
          row.currencyId !== input.currencyId ||
          row.taskId !== input.taskId ||
          (row.advanceRecipientId &&
            row.advanceRecipientId !== input.recipientId) ||
          advanced.gt(row.amount)
        ) {
          throw new Error(
            "Conflict error. Advance differs from the funded reservation",
          );
        }
        const receipt = await this.post(input, row.id);
        await this.records.update({
          id: row.id,
          data: {
            advanceRecipientId: input.recipientId,
            advanceAmount: advanced.toFixed(),
            updatedAt: new Date(),
          },
        });
        return receipt;
      },
    );
  }

  private refund(row: IReceipt, amount: Decimal): IOperation {
    if (!row.advanceRecipientId)
      throw new Error("Conflict error. Advance recipient missing");
    return {
      storeId: row.storeId,
      taskId: row.taskId,
      currencyId: row.currencyId,
      senderId: row.advanceRecipientId,
      recipientId: row.senderId,
      actorId: row.actorId,
      amount: amount.toFixed(),
      operationKey: `settlement:${row.id}:refund`,
      purpose: "unused-provider-advance",
    };
  }

  async release(storeId: string, reservationKey: string) {
    const first = await this.reservation(storeId, reservationKey);
    const wallets = [this.walletKey(first.senderId, first.currencyId)];
    const executor = first.providerWork?.executorId ?? first.advanceRecipientId;
    if (executor) wallets.push(this.walletKey(executor, first.currencyId));
    return this.subject.repository.withWalletLocks(
      [...wallets, `key:${storeId}:${reservationKey}`],
      async () => {
        const row = await this.reservation(storeId, reservationKey);
        if (row.state === "settled") {
          throw new Error(
            "Conflict error. The reservation has already settled",
          );
        }
        if (row.state === "released") {
          return row;
        }
        if (row.advanceRecipientId && new Money(row.advanceAmount).gt(0)) {
          await this.post(
            this.refund(row, new Money(row.advanceAmount)),
            row.id,
          );
        }
        return this.records.update({
          id: row.id,
          data: { state: "released", updatedAt: new Date() },
        });
      },
    );
  }

  private async reservation(storeId: string, operationKey: string) {
    const row = await this.records.byKey(storeId, operationKey);
    if (!row || row.kind !== "reserve") {
      throw new Error("Not found. Work reservation");
    }
    return row;
  }

  // Only a verified provider result may settle; an unknown outcome retains the hold.
  async settle(data: ISettlement) {
    const input = z
      .object({
        storeId: z.uuid(),
        reservationKey: key,
        recipientId: z.uuid(),
        providerSubjectId: z.uuid(),
        workAmount: amount,
        providerAmount: amount,
      })
      .strict()
      .parse(data);
    const row = await this.reservation(input.storeId, input.reservationKey);
    const work = new Money(input.workAmount);
    const compute = new Money(input.providerAmount);
    if (
      row.recipientId !== input.recipientId ||
      work.gt(row.amount) ||
      compute.gt(work) ||
      input.providerSubjectId === input.recipientId ||
      input.providerSubjectId === row.senderId
    ) {
      throw new Error("Validation error. Settlement differs from funded work");
    }
    const workKey = `settlement:${row.id}:work`;
    const providerKey = `settlement:${row.id}:provider`;
    const workLeg: IOperation = {
      storeId: row.storeId,
      taskId: row.taskId,
      currencyId: row.currencyId,
      actorId: row.actorId,
      senderId: row.senderId,
      recipientId: row.recipientId,
      amount: work.toFixed(),
      operationKey: workKey,
      purpose: row.purpose,
    };
    const providerLeg: IOperation = {
      ...workLeg,
      senderId: row.recipientId,
      recipientId: input.providerSubjectId,
      amount: compute.toFixed(),
      operationKey: providerKey,
      purpose: "provider-work",
    };
    const keys = [
      ...this.keys(workLeg),
      ...this.keys(providerLeg),
      `key:${row.storeId}:${row.operationKey}`,
    ];
    return this.subject.repository.withWalletLocks(keys, async () => {
      const current = await this.reservation(row.storeId, row.operationKey);
      if (current.state === "released") {
        throw new Error("Conflict error. Released reservation");
      }
      if (
        current.advanceRecipientId &&
        current.advanceRecipientId !== input.providerSubjectId
      ) {
        throw new Error("Conflict error. Wrong advance recipient");
      }
      const advance = new Money(current.advanceAmount);
      const used = Money.min(advance, compute);
      const legs: IOperation[] = [
        { ...workLeg, amount: work.minus(used).toFixed() },
        { ...providerLeg, amount: compute.minus(used).toFixed() },
      ];
      if (advance.gt(used))
        legs.push(this.refund(current, advance.minus(used)));
      if (current.state === "settled") {
        if (
          !current.settlement ||
          current.settlement.providerSubjectId !== input.providerSubjectId ||
          !work.eq(current.settlement.workAmount) ||
          !compute.eq(current.settlement.providerAmount)
        ) {
          throw new Error("Conflict error. Settlement terms changed");
        }
        const receipts: IReceipt[] = [];
        for (const leg of legs) {
          const previous = await this.records.byKey(
            row.storeId,
            leg.operationKey,
          );
          if (previous) {
            receipts.push(this.previous(previous, leg, "transfer"));
          } else if (!new Money(leg.amount).isZero()) {
            throw new Error("Conflict error. Settlement amount changed");
          }
        }
        return receipts;
      }
      const receipts: IReceipt[] = [];
      for (const leg of legs) {
        if (new Money(leg.amount).gt(0)) {
          receipts.push(await this.post(leg, row.id));
        }
      }
      await this.records.update({
        id: row.id,
        data: {
          state: "settled",
          settlement: {
            providerSubjectId: input.providerSubjectId,
            workAmount: work.toFixed(),
            providerAmount: compute.toFixed(),
          },
          updatedAt: new Date(),
        },
      });
      return receipts;
    });
  }
}

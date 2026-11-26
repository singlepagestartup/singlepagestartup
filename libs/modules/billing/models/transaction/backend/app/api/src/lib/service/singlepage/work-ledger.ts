import Decimal from "decimal.js";
import { z } from "zod";
import type { Service as Transactions } from "../index";
import type { Service as Balances } from "@sps/billing/relations/wallets-to-currencies/backend/app/api/src/lib/service";
import type { Service as Parties } from "@sps/billing/relations/transactions-to-wallets/backend/app/api/src/lib/service";
import type { IModel as IReceipt } from "@sps/billing/models/transaction/sdk/model";

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
  eventId?: string;
  stageId?: string;
  runBudget?: string;
  taskBudget?: string;
  budget?: string;
}
interface ISettlement {
  storeId: string;
  reservationKey: string;
  recipientId: string;
  providerSubjectId?: string;
  workAmount: string;
  providerAmount?: string;
}

interface IWalletOwnership {
  defaultWallet(subjectId: string): Promise<string | undefined>;
  ensureDefaultWallet(subjectId: string): Promise<string>;
}

export class WorkLedger {
  constructor(
    private readonly records: Transactions,
    private readonly balances: Balances,
    private readonly transactionWallets: Parties,
    private readonly owners: IWalletOwnership,
    private readonly withLocks: <T>(
      keys: string[],
      run: () => Promise<T>,
    ) => Promise<T>,
  ) {}

  private async parties(input: IOperation) {
    const owners = this.owners;
    // Take first-use ownership locks in a stable order across currencies.
    const ids = [input.senderId, input.recipientId].sort();
    const first = await owners.ensureDefaultWallet(ids[0]);
    const second = await owners.ensureDefaultWallet(ids[1]);
    return {
      senderWalletId: ids[0] === input.senderId ? first : second,
      recipientWalletId: ids[0] === input.recipientId ? first : second,
      currencyId: input.currencyId,
    };
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

  private async fundCheck(
    input: IOperation,
    budget?: string,
    eventId?: string,
    runBudget?: string,
    stageId?: string,
    taskBudget?: string,
  ) {
    const walletId = await this.owners.defaultWallet(input.senderId);
    if (!walletId) {
      throw new Error(
        "Payment required. Insufficient available wallet balance",
      );
    }
    const total = await this.balances.total(walletId, input.currencyId);
    const obligations = await this.records.obligations(
      walletId,
      input.currencyId,
      input.storeId,
      input.taskId,
      eventId,
      stageId,
    );
    if (new Money(total).minus(obligations.held).lt(input.amount)) {
      throw new Error(
        "Payment required. Insufficient available wallet balance",
      );
    }
    if (
      stageId &&
      budget !== undefined &&
      new Money(obligations.stageCommitted).plus(input.amount).gt(budget)
    ) {
      throw new Error("Payment required. Stage spending limit reached");
    }
    const taskLimit = stageId ? taskBudget : budget;
    if (
      taskLimit !== undefined &&
      new Money(obligations.committed).plus(input.amount).gt(taskLimit)
    ) {
      throw new Error("Payment required. Task spending limit reached");
    }
    if (
      runBudget &&
      new Money(obligations.runCommitted).plus(input.amount).gt(runBudget)
    ) {
      throw new Error("Payment required. Run spending limit reached");
    }
  }

  private async post(input: IOperation, reservationId?: string) {
    const parties = await this.parties(input);
    await this.balances.applyDelta(
      parties.senderWalletId,
      input.currencyId,
      new Money(input.amount).negated().toFixed(),
    );
    await this.balances.applyDelta(
      parties.recipientWalletId,
      input.currencyId,
      input.amount,
    );
    const receipt = await this.records.create({
      data: { ...input, kind: "transfer", state: "posted", reservationId },
    });
    await this.transactionWallets.create({
      data: { transactionId: receipt.id, ...parties },
    });
    return receipt;
  }

  private keys(input: IOperation) {
    return [
      `owner:${input.senderId}`,
      `owner:${input.recipientId}`,
      this.walletKey(input.senderId, input.currencyId),
      this.walletKey(input.recipientId, input.currencyId),
      `key:${input.storeId}:${input.operationKey}`,
    ];
  }

  async transfer(data: IOperation) {
    const input = operation.parse(data);
    this.positive(input);
    return this.withLocks(this.keys(input), async () => {
      const prior = await this.records.byKey(input.storeId, input.operationKey);
      if (prior) {
        return this.previous(prior, input, "transfer");
      }
      await this.fundCheck(input);
      return this.post(input);
    });
  }

  async reserve(data: IReservation) {
    const { budget, taskBudget, runBudget, eventId, stageId, ...input } =
      operation
        .extend({
          budget: amount.optional(),
          taskBudget: amount.optional(),
          runBudget: amount.optional(),
          eventId: z.uuid().optional(),
          stageId: key.optional(),
        })
        .parse(data);
    if (runBudget !== undefined && eventId === undefined) {
      throw new Error(
        "Validation error. A run limit and event ID are required together",
      );
    }
    this.positive(input);
    return this.withLocks(
      [
        ...this.keys(input),
        `task-budget:${input.storeId}:${input.taskId}:${input.currencyId}`,
      ],
      async () => {
        const prior = await this.records.byKey(
          input.storeId,
          input.operationKey,
        );
        if (prior) {
          if (
            (prior.eventId ?? undefined) !== eventId ||
            Boolean(prior.budget) !== Boolean(budget) ||
            (prior.stageId ?? undefined) !== stageId ||
            Boolean(prior.runBudget) !== Boolean(runBudget) ||
            (prior.runBudget &&
              runBudget &&
              !new Money(prior.runBudget).eq(runBudget))
          ) {
            throw new Error("Conflict error. Run reservation terms changed");
          }
          return this.previous(prior, input, "reserve", budget);
        }
        await this.fundCheck(
          input,
          budget,
          eventId,
          runBudget,
          stageId,
          taskBudget,
        );
        const parties = await this.parties(input);
        const receipt = await this.records.create({
          data: {
            ...input,
            budget,
            eventId,
            stageId,
            runBudget,
            kind: "reserve",
            state: "held",
          },
        });
        await this.transactionWallets.create({
          data: { transactionId: receipt.id, ...parties },
        });
        return receipt;
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
    return this.withLocks([`key:${storeId}:${key}`], async () => {
      const row = await this.reservation(storeId, key);
      const next = await this.records.update({
        id: row.id,
        data: {
          providerWork: update(row.providerWork),
          updatedAt: new Date(),
        },
      });
      if (!next) {
        throw new Error("Not found. Work reservation");
      }
      return next;
    });
  }

  async advance(data: IOperation, reservationKey: string) {
    const input = operation.parse(data);
    this.positive(input);
    return this.withLocks(
      [...this.keys(input), `key:${input.storeId}:${reservationKey}`],
      async () => {
        const row = await this.reservation(input.storeId, reservationKey);
        const previous = await this.records.byKey(
          input.storeId,
          input.operationKey,
        );
        if (previous) {
          if (previous.reservationId !== row.id) {
            throw new Error("Conflict error. Different advance reservation");
          }
          return this.previous(previous, input, "transfer");
        }
        const advanced = new Money(row.advanceAmount).plus(input.amount);
        if (
          row.providerWork?.providerMode === "server" ||
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
        const [link] = await this.transactionWallets.find({
          params: {
            filters: {
              and: [{ column: "transactionId", method: "eq", value: row.id }],
            },
          },
        });
        if (!link) {
          throw new Error(
            "Data integrity error. Reservation wallets are missing",
          );
        }
        const advanceRecipientWalletId = await this.owners.ensureDefaultWallet(
          input.recipientId,
        );
        await this.transactionWallets.update({
          id: link.id,
          data: { advanceRecipientWalletId },
        });
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
    if (!row.advanceRecipientId) {
      throw new Error("Conflict error. Advance recipient missing");
    }
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
    if (executor) {
      wallets.push(this.walletKey(executor, first.currencyId));
    }
    return this.withLocks(
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
        providerSubjectId: z.uuid().optional(),
        workAmount: amount,
        providerAmount: amount.optional(),
      })
      .strict()
      .parse(data);
    const row = await this.reservation(input.storeId, input.reservationKey);
    const work = new Money(input.workAmount);
    const compute = new Money(input.providerAmount ?? "0");
    const server = row.providerWork?.providerMode === "server";
    if (
      (server
        ? Boolean(input.providerSubjectId || input.providerAmount)
        : !input.providerSubjectId || input.providerAmount === undefined) ||
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
    let providerLeg: IOperation | undefined;
    if (input.providerSubjectId) {
      providerLeg = {
        ...workLeg,
        senderId: row.recipientId,
        recipientId: input.providerSubjectId,
        amount: compute.toFixed(),
        operationKey: providerKey,
        purpose: "provider-work",
      };
    }
    const keys = [
      ...this.keys(workLeg),
      ...(providerLeg ? this.keys(providerLeg) : []),
      `key:${row.storeId}:${row.operationKey}`,
    ];
    return this.withLocks(keys, async () => {
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
      ];
      if (providerLeg) {
        legs.push({ ...providerLeg, amount: compute.minus(used).toFixed() });
      }
      if (advance.gt(used)) {
        legs.push(this.refund(current, advance.minus(used)));
      }
      if (current.state === "settled") {
        if (
          !current.settlement ||
          current.settlement.providerSubjectId !== input.providerSubjectId ||
          !work.eq(current.settlement.workAmount) ||
          !compute.eq(current.settlement.providerAmount ?? "0")
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
            providerAmount: providerLeg ? compute.toFixed() : undefined,
          },
          updatedAt: new Date(),
        },
      });
      return receipts;
    });
  }
}

import { randomUUID } from "node:crypto";
import { inArray, eq } from "drizzle-orm";
import { createAppAssembly } from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { Table as Operation } from "@sps/rbac/relations/subjects-to-wallet-operations/backend/repository/database";
import { Table as Balance } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Table as Subject } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

const service = createService(createAppAssembly());
const storeId = randomUUID(),
  currencyId = randomUUID(),
  taskId = randomUUID();
const senderId = randomUUID(),
  recipientId = randomUUID(),
  providerSubjectId = randomUUID();
const input = {
  storeId,
  currencyId,
  taskId,
  senderId,
  recipientId,
  actorId: senderId,
  operationKey: "last-balance",
  purpose: "agent-work",
  amount: "40",
  budget: "100",
};

beforeAll(async () => {
  const db = getDrizzle({});
  await db.insert(Store).values({ id: storeId });
  await db
    .insert(Currency)
    .values({ id: currencyId, title: "Integration credits", symbol: "SPS" });
  await db
    .insert(Subject)
    .values([senderId, recipientId, providerSubjectId].map((id) => ({ id })));
  await db.insert(Balance).values({
    subjectId: senderId,
    billingModuleCurrencyId: currencyId,
    amount: "50",
  });
});
afterAll(async () => {
  const db = getDrizzle({});
  await db.delete(Operation).where(eq(Operation.storeId, storeId));
  await db
    .delete(Balance)
    .where(eq(Balance.billingModuleCurrencyId, currencyId));
  await db
    .delete(Subject)
    .where(inArray(Subject.id, [senderId, recipientId, providerSubjectId]));
  await db.delete(Store).where(eq(Store.id, storeId));
  await db.delete(Currency).where(eq(Currency.id, currencyId));
  await getPostgresClient().end();
  resetPostgresClient();
});

it("serializes last-balance reservations, posts each transfer once and releases the unused amount", async () => {
  const ledger = service.workLedger;
  const outcomes = await Promise.allSettled([
    ledger.reserve(input),
    ledger.reserve({ ...input, operationKey: "second" }),
  ]);
  expect(outcomes.filter((row) => row.status === "fulfilled")).toHaveLength(1);
  const winner = outcomes.find((row) => row.status === "fulfilled");
  if (winner?.status !== "fulfilled")
    throw new Error("Expected one reservation");
  const reservationKey = winner.value.operationKey;
  const claim = {
    storeId,
    reservationKey,
    recipientId,
    providerSubjectId,
    workAmount: "26",
    providerAmount: "20",
  };
  const [first, retry] = await Promise.all([
    ledger.settle(claim),
    ledger.settle(claim),
  ]);
  expect(first.map((x) => x.id)).toEqual(retry.map((x) => x.id));
  await expect(
    ledger.settle({ ...claim, providerAmount: "19" }),
  ).rejects.toThrow("Conflict");
  const wallets = service.module.subjectsToBillingModuleCurrencies;
  const totals = await Promise.all(
    [senderId, recipientId, providerSubjectId].map((id) =>
      wallets.total(id, currencyId),
    ),
  );
  expect(totals.map(Number)).toEqual([24, 6, 20]);
  const followup = await ledger.reserve({
    ...input,
    operationKey: "followup",
    amount: "24",
  });
  expect((await ledger.release(storeId, followup.operationKey))?.state).toBe(
    "released",
  );
  const transfer = { ...input, operationKey: "new-transfer", amount: "24" };
  const { budget, ...terms } = transfer;
  expect((await ledger.transfer(terms)).id).toEqual(
    (await ledger.transfer(terms)).id,
  );
  await expect(ledger.transfer({ ...terms, amount: "1" })).rejects.toThrow(
    "Conflict",
  );
});

it("credits a targeted advance once and returns its unused part on settlement", async () => {
  const payer = randomUUID(),
    task = randomUUID();
  const db = getDrizzle({});
  await db.insert(Subject).values({ id: payer });
  await db.insert(Balance).values({
    subjectId: payer,
    billingModuleCurrencyId: currencyId,
    amount: "45",
  });
  try {
    const ledger = service.workLedger;
    const attempt = {
      ...input,
      senderId: payer,
      actorId: payer,
      taskId: task,
      operationKey: "prepaid",
    };
    await ledger.reserve(attempt);
    const transfer = {
      storeId,
      currencyId,
      taskId: task,
      senderId: payer,
      actorId: payer,
      recipientId: providerSubjectId,
      operationKey: "deposit",
      purpose: "provider-advance",
      amount: "30",
    };
    const advance = await ledger.advance(transfer, "prepaid");
    expect((await ledger.advance(transfer, "prepaid")).id).toEqual(advance.id);
    const claim = {
      storeId,
      reservationKey: "prepaid",
      recipientId,
      providerSubjectId,
      workAmount: "26",
      providerAmount: "20",
    };
    const receipts = await ledger.settle(claim);
    expect(receipts.map((row) => [row.purpose, Number(row.amount)])).toEqual([
      ["agent-work", 6],
      ["unused-provider-advance", 10],
    ]);
    expect((await ledger.settle(claim)).map((row) => row.id)).toEqual(
      receipts.map((row) => row.id),
    );
    expect(
      Number(
        await service.module.subjectsToBillingModuleCurrencies.total(
          payer,
          currencyId,
        ),
      ),
    ).toBe(19);
  } finally {
    await db.delete(Operation).where(eq(Operation.taskId, task));
    await db.delete(Balance).where(eq(Balance.subjectId, payer));
    await db.delete(Subject).where(eq(Subject.id, payer));
  }
});

it("shares the run and task ceilings across paid steps and funding wallets", async () => {
  const task = randomUUID(),
    eventId = randomUUID();
  const payers = [randomUUID(), randomUUID()];
  const db = getDrizzle({});
  await db.insert(Subject).values(payers.map((id) => ({ id })));
  await db
    .insert(Balance)
    .values(
      payers.map((subjectId) => ({
        subjectId,
        billingModuleCurrencyId: currencyId,
        amount: "80",
      })),
    );
  try {
    const base = {
      ...input,
      taskId: task,
      amount: "20",
      budget: "50",
      runBudget: "25",
      eventId,
    };
    const candidates = payers.map((payer, i) => ({
      ...base,
      senderId: payer,
      actorId: payer,
      operationKey: `run-step-${i}`,
    }));
    const claims = await Promise.allSettled(
      candidates.map((candidate) => service.workLedger.reserve(candidate)),
    );
    const winner = claims.findIndex((claim) => claim.status === "fulfilled");
    expect(claims.filter((claim) => claim.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(claims[1 - winner]).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({
        message: expect.stringContaining("Run spending limit"),
      }),
    });
    await expect(
      service.workLedger.reserve({ ...candidates[winner], runBudget: "24" }),
    ).rejects.toThrow("terms changed");
    await service.workLedger.reserve({
      ...candidates[1 - winner],
      operationKey: "different-event",
      amount: "25",
      eventId: randomUUID(),
    });
    await expect(
      service.workLedger.reserve({
        ...candidates[winner],
        operationKey: "over-task",
        amount: "6",
        eventId: randomUUID(),
      }),
    ).rejects.toThrow("Task spending limit");
  } finally {
    await db.delete(Operation).where(eq(Operation.taskId, task));
    await db.delete(Balance).where(inArray(Balance.subjectId, payers));
    await db.delete(Subject).where(inArray(Subject.id, payers));
  }
});

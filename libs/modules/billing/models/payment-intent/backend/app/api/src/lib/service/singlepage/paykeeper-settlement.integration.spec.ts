/**
 * BDD Suite: atomic PayKeeper settlement with PostgreSQL.
 * Given: an isolated Payment Intent, PayKeeper Invoice and relation.
 * When: duplicate callbacks race, payment details disagree or a write fails.
 * Then: one settlement commits, mismatches write nothing and failure is retryable without partial payment state.
 */
import { randomUUID } from "node:crypto";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as IntentRepository } from "../../repository";
import { Configuration as IntentConfiguration } from "../../configuration";
import { Service as IntentService } from "./index";
import { Repository as InvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as InvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Service as InvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Repository as RelationRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as RelationConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";
import { Service as RelationService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import {
  Service as Settlement,
  type IExecuteProps,
} from "./paykeeper-settlement";

const removals: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of removals.splice(0).reverse()) await remove();
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const repository = new IntentRepository(new IntentConfiguration());
  const invoices = new InvoiceService(
    new InvoiceRepository(new InvoiceConfiguration()),
  );
  const relations = new RelationService(
    new RelationRepository(new RelationConfiguration()),
  );
  const service = new IntentService(repository, {
    invoice: invoices,
    paymentIntentsToInvoices: relations,
    currency: {},
  } as any);
  const intent = await service.create({ data: { amount: 100 } as any });
  removals.push(() => service.delete({ id: intent.id }));
  const invoice = await invoices.create({
    data: {
      amount: 100,
      status: "open",
      provider: "paykeeper",
      providerId: "456",
    } as any,
  });
  removals.push(() => invoices.delete({ id: invoice.id }));
  const link = await relations.create({
    data: { paymentIntentId: intent.id, invoiceId: invoice.id } as any,
  });
  removals.push(() => relations.delete({ id: link.id }));
  const props: IExecuteProps = {
    event: {
      id: "301",
      orderid: intent.id,
      clientid: "",
      amountInMinorUnits: 10000,
      acknowledgment: "OK test",
    },
    invoiceId: invoice.id,
    providerId: "456",
    providerInvoice: {
      id: "456",
      status: "paid",
      orderid: intent.id,
      paymentid: "301",
      clientid: "",
      pay_amount: "100.00",
    } as any,
  };
  const settlement = new Settlement({ repository, service });
  const second = new Settlement({
    repository: new IntentRepository(new IntentConfiguration()),
    service,
  });
  return { service, invoices, settlement, second, props, intent, invoice };
}

it("serializes independent instances and preserves timestamps when the same callback is retried", async () => {
  const f = await fixture();
  const invoiceWrite = jest.spyOn(f.invoices, "update");
  const intentWrite = jest.spyOn(f.service, "update");
  await Promise.all([
    f.settlement.execute(f.props),
    f.second.execute(f.props),
    f.settlement.execute(f.props),
    f.second.execute(f.props),
  ]);
  expect(invoiceWrite).toHaveBeenCalledTimes(1);
  expect(intentWrite).toHaveBeenCalledTimes(1);
  const paid = await f.invoices.findById({ id: f.invoice.id });
  const succeeded = await f.service.findById({ id: f.intent.id });
  expect(paid?.status).toBe("paid");
  expect(succeeded?.status).toBe("succeeded");
  await f.second.execute(f.props);
  expect((await f.invoices.findById({ id: f.invoice.id }))?.updatedAt).toEqual(
    paid?.updatedAt,
  );
  expect((await f.service.findById({ id: f.intent.id }))?.updatedAt).toEqual(
    succeeded?.updatedAt,
  );
});

it("rolls back the Invoice when the Payment Intent update fails and then retries successfully", async () => {
  const f = await fixture();
  const fail = jest
    .spyOn(f.service, "update")
    .mockRejectedValueOnce(new Error("fixture payment write failure"));
  await expect(f.settlement.execute(f.props)).rejects.toThrow(
    "fixture payment write failure",
  );
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "open",
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "requires_payment_method",
  );
  fail.mockRestore();
  await f.settlement.execute(f.props);
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});

it.each([
  { paymentid: "999" },
  { pay_amount: "100.99" },
  { orderid: randomUUID() },
  { clientid: "foreign-client" },
  { id: "another-invoice" },
  { status: "sent" },
])(
  "refuses mismatched provider confirmation (%p) without writes",
  async (change) => {
    const f = await fixture();
    await expect(
      f.settlement.execute({
        ...f.props,
        providerInvoice: { ...f.props.providerInvoice, ...change } as any,
      }),
    ).rejects.toThrow();
    expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
      "open",
    );
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "requires_payment_method",
    );
  },
);

it("does not revive a canceled Payment Intent", async () => {
  const f = await fixture();
  await f.service.update({
    id: f.intent.id,
    data: { ...f.intent, status: "canceled" },
  });
  await expect(f.settlement.execute(f.props)).rejects.toThrow(
    "Conflict error. PayKeeper payment was canceled",
  );
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "open",
  );
});

import { Service } from "./index";
import { Repository as OrderRepository } from "../../../repository";
import { Service as OrderService } from "../index";
import { Service as OrderLifecycleService } from "../../startup/lifecycle";
import { Configuration as OrderConfiguration } from "../../../configuration";
import { Repository as InvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as InvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Service as InvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { getPostgresClient } from "@sps/shared-backend-database-config";

describe("subscription period PostgreSQL write boundary", () => {
  const orders = new OrderRepository(new OrderConfiguration());
  const invoices = new InvoiceRepository(new InvoiceConfiguration());
  const invoiceService = new InvoiceService(invoices);
  const lifecycle = new OrderLifecycleService(orders);
  const orderService = Object.create(OrderService.prototype) as OrderService;
  orderService.repository = orders;
  const orderIds: string[] = [];
  const invoiceIds: string[] = [];
  afterAll(async () => {
    for (const id of orderIds) await orders.deleteFirstByField("id", id);
    for (const id of invoiceIds) await invoices.deleteFirstByField("id", id);
    await getPostgresClient().end();
  });

  it("accepts concurrent retries once, prevents invoice clock replay and preserves real paid status writes", async () => {
    const order = await orders.insert({
      type: "history",
      status: "paid",
      comment: "issue-376-period-integration",
    });
    orderIds.push(order.id!);
    const first = await invoices.insert({
      status: "paid",
      provider: "dummy",
      amount: 0,
    });
    invoiceIds.push(first.id!);
    const paymentInvoices: string[] = [first.id!];
    const service = new Service({
      findById: ({ id }) => orders.findFirstByField("id", id),
      writeSubscriptionPeriod: (props) =>
        lifecycle.writeSubscriptionPeriod(props),
      findByIdExtended: async ({ id }) =>
        ({
          ...(await orders.findFirstByField("id", id)),
          checkoutAttributesByCurrency: {
            type: "subscription",
            interval: "day",
          },
          ordersToBillingModulePaymentIntents: [
            {
              billingModulePaymentIntent: {
                status: "succeeded",
                paymentIntentsToInvoices: await Promise.all(
                  paymentInvoices.map(async (id) => ({
                    invoice: await invoices.findFirstByField("id", id),
                  })),
                ),
              },
            },
          ],
        }) as any,
    });
    const firstResults = await Promise.all(
      Array.from({ length: 6 }, () =>
        service.execute({ id: order.id!, expectedInvoiceId: null }),
      ),
    );
    expect(firstResults.filter((result) => result.accepted)).toHaveLength(1);
    const acceptedA = await orders.findFirstByField("id", order.id);
    const second = await invoices.insert({
      status: "open",
      provider: "dummy",
      amount: 0,
    });
    invoiceIds.push(second.id!);
    paymentInvoices.push(second.id!);
    expect(
      (await service.execute({ id: order.id!, expectedInvoiceId: first.id! }))
        .accepted,
    ).toBe(false);
    await invoices.updateFirstByField("id", second.id, {
      ...second,
      status: "paid",
    });
    const renewalResults = await Promise.all(
      Array.from({ length: 6 }, () =>
        service.execute({ id: order.id!, expectedInvoiceId: first.id! }),
      ),
    );
    expect(renewalResults.filter((result) => result.accepted)).toHaveLength(0);
    const acceptedB = await orders.findFirstByField("id", order.id);
    expect(
      await lifecycle.expireSubscriptionPeriod({
        before: { ...acceptedA, subscriptionPeriodInvoiceId: second.id },
        now: new Date(
          new Date(acceptedA.subscriptionPeriodEndsAt).getTime() + 1,
        ),
      }),
    ).toBeUndefined();
    expect((await orders.findFirstByField("id", order.id)).status).toBe(
      "delivering",
    );
    expect(new Date(acceptedB.subscriptionPeriodEndsAt).getTime()).toBe(
      new Date(acceptedA.subscriptionPeriodEndsAt).getTime(),
    );
    await expect(
      invoiceService.update({
        id: first.id!,
        data: {
          ...first,
          createdAt: new Date(Date.now() + 100000),
          status: "paid",
        },
      }),
    ).rejects.toThrow("immutable");
    expect(
      (await service.execute({ id: order.id!, expectedInvoiceId: second.id! }))
        .accepted,
    ).toBe(false);
    expect(
      (await orders.findFirstByField("id", order.id)).subscriptionPeriodEndsAt,
    ).toEqual(acceptedB.subscriptionPeriodEndsAt);
    await expect(
      orderService.update({
        id: order.id!,
        data: {
          ...acceptedB,
          subscriptionPeriodEndsAt: new Date(Date.now() + 999999999),
        },
      }),
    ).rejects.toThrow("server managed");
    const beforeRevoke = await orders.findFirstByField("id", order.id);
    expect(await lifecycle.revokeSubscription({ id: order.id! })).toBeDefined();
    expect(
      await lifecycle.revokeSubscription({ id: order.id! }),
    ).toBeUndefined();
    expect(
      await lifecycle.writeSubscriptionPeriod({
        id: order.id!,
        before: beforeRevoke,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 10000),
        invoiceId: first.id!,
        status: "delivering",
      }),
    ).toBeUndefined();
    await expect(
      orderService.update({
        id: order.id!,
        data: {
          ...beforeRevoke,
          subscriptionRevokedAt: null,
        },
      }),
    ).rejects.toThrow("server managed");
    await expect(
      service.execute({ id: order.id!, expectedInvoiceId: second.id! }),
    ).rejects.toThrow("explicitly revoked");
  });
});

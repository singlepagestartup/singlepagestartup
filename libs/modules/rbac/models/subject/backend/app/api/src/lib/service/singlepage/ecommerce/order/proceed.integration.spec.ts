import { randomUUID } from "node:crypto";
import { Service } from "./proceed";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Repository as OrderRepository } from "@sps/ecommerce/models/order/backend/app/api/src/lib/repository";
import { Configuration as OrderConfiguration } from "@sps/ecommerce/models/order/backend/app/api/src/lib/configuration";
import { Repository as InvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as InvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Repository as RoleRepository } from "@sps/rbac/models/role/backend/app/api/src/lib/repository";
import { Configuration as RoleConfiguration } from "@sps/rbac/models/role/backend/app/api/src/lib/configuration";
import { Repository as CurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as CurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Repository as GrantsRepository } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/repository";
import { Configuration as GrantsConfiguration } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/configuration";
import { Service as GrantsService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Repository as BalanceRepository } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as BalanceConfiguration } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BalanceService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as PeriodService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { scopeDependencyKey } from "@sps/shared-backend-api";

describe("paid order atomic fulfillment", () => {
  const subjects = new SubjectRepository(new SubjectConfiguration());
  const orders = new OrderRepository(new OrderConfiguration());
  const invoices = new InvoiceRepository(new InvoiceConfiguration());
  const roles = new RoleRepository(new RoleConfiguration());
  const currencies = new CurrencyRepository(new CurrencyConfiguration());
  const grantRepository = new GrantsRepository(new GrantsConfiguration());
  const balanceRepository = new BalanceRepository(new BalanceConfiguration());
  const grants = new GrantsService(grantRepository);
  const balances = new BalanceService(balanceRepository);
  const cleanup: (() => Promise<unknown>)[] = [];
  afterAll(async () => {
    const [removeSubject, ...otherRemovals] = cleanup;
    if (removeSubject) await removeSubject();
    for (const remove of otherRemovals.reverse()) await remove();
    await getPostgresClient().end();
  });

  it("rolls back period, Role and credit on failure; retries once and captures committed direct writes", async () => {
    const suffix = randomUUID();
    const subject = await subjects.insert({ slug: `issue-376-${suffix}` });
    cleanup.push(() => subjects.deleteFirstByField("id", subject.id));
    const role = await roles.insert({
      slug: `issue-376-${suffix}`,
      title: `Issue 376 ${suffix}`,
    });
    cleanup.push(() => roles.deleteFirstByField("id", role.id));
    const currency = await currencies.insert({
      slug: `issue-376-${suffix}`,
      title: "Synthetic credit",
      symbol: "test",
    });
    cleanup.push(() => currencies.deleteFirstByField("id", currency.id));
    const order = await orders.insert({
      type: "history",
      status: "paid",
      comment: "issue-376-atomic-fulfillment",
    });
    cleanup.push(() => orders.deleteFirstByField("id", order.id));
    const invoice = await invoices.insert({
      status: "paid",
      amount: 0,
      provider: "dummy",
    });
    cleanup.push(() => invoices.deleteFirstByField("id", invoice.id));
    const balance = await balances.create({
      data: {
        subjectId: subject.id,
        billingModuleCurrencyId: currency.id,
        amount: "0",
      },
    });
    let activeOrderId = order.id;
    let activeInvoices = [invoice.id];
    let quantity = 1;
    let creditAmount = "5000";
    let productType = "subscription";
    const readExtended = async () =>
      ({
        ...(await orders.findFirstByField("id", activeOrderId)),
        checkoutAttributesByCurrency: {
          amount: 0,
          type: productType,
          interval: "day",
        },
        ordersToProducts: [
          {
            productId: "synthetic-product",
            quantity,
            product: {
              productsToAttributes: [
                {
                  attribute: {
                    number: creditAmount,
                    attributeKeysToAttribute: [
                      { attributeKey: { type: "topup" } },
                    ],
                    attributesToBillingModuleCurrencies: [
                      {
                        billingModuleCurrencyId: currency.id,
                        billingModuleCurrency: currency,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        ordersToBillingModulePaymentIntents: [
          {
            billingModulePaymentIntent: {
              type: "one_off",
              paymentIntentsToInvoices: await Promise.all(
                activeInvoices.map(async (id) => ({
                  invoice: await invoices.findFirstByField("id", id),
                })),
              ),
              paymentIntentsToCurrencies: [{ currency }],
            },
          },
        ],
        ordersToFileStorageModuleFiles: [],
      }) as any;
    const period = new PeriodService({
      findByIdExtended: readExtended,
      findById: ({ id }) => orders.findFirstByField("id", id),
      writeSubscriptionPeriod: (props) => orders.writeSubscriptionPeriod(props),
    });
    const service = new Service(
      subjects,
      { attribute: { find: async () => [] } } as any,
      {
        order: {
          lockForLifecycle: (props) => orders.lockForLifecycle(props),
          findByIdExtended: readExtended,
          assertSubscriptionPayment: (props) => period.assertPayment(props),
          acceptSubscriptionPeriod: (props) => period.execute(props),
          find: async (props) => {
            const current = await orders.findFirstByField("id", activeOrderId);
            const status = props.params.filters.and.find(
              (filter) => filter.column === "status",
            );
            return !status || current.status === status.value ? [current] : [];
          },
          update: ({ id, data }) => orders.updateFirstByField("id", id, data),
        },
      } as any,
      { template: { find: async () => [] } } as any,
      {} as any,
      {} as any,
      {
        find: async () => [
          { ecommerceModuleProductId: "synthetic-product", roleId: role.id },
        ],
      } as any,
      {
        find: async () => [
          { subjectId: subject.id, ecommerceModuleOrderId: activeOrderId },
        ],
      } as any,
      grants,
      { find: async () => [] } as any,
      balances,
      {} as any,
      async () => undefined,
    );
    const admin = jest
      .spyOn(service, "notifyAdmin")
      .mockResolvedValue(undefined);
    const owner = jest
      .spyOn(service, "notifyOrderOwner")
      .mockResolvedValue(undefined);
    const input = {
      order: await readExtended(),
      extendedOrder: await readExtended(),
      subjectToEcommerceModuleOrder: {
        subjectId: subject.id!,
        ecommerceModuleOrderId: order.id!,
      },
    };
    const keys = [
      scopeDependencyKey("public.sps_ee_order", "id", order.id!),
      scopeDependencyKey("public.sps_rc_ss_to_rs_3nw", "st_id", subject.id!),
      scopeDependencyKey("public.sps_rc_ss_to_bg_me_cs_vvd", "id", balance.id),
    ];
    const versions = async () => {
      const rows =
        await getPostgresClient()`SELECT key,version::text AS version FROM sps_consistency.generation WHERE key = ANY(${getPostgresClient().array(keys)}::text[])`;
      return keys.map(
        (key) => rows.find((row) => row.key === key)?.version ?? "0",
      );
    };
    const before = await versions();
    const credit = jest
      .spyOn(balances, "updateAmountIfUnchanged")
      .mockRejectedValueOnce(new Error("synthetic credit failure"));
    await expect(service.fromPaidStatus(input)).rejects.toThrow(
      "synthetic credit failure",
    );
    const failed = await orders.findFirstByField("id", order.id);
    expect(failed.status).toBe("paid");
    expect(failed.subscriptionPeriodInvoiceId).toBeNull();
    expect(
      await grants.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subject.id }],
          },
        },
      }),
    ).toHaveLength(0);
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("0");
    expect(await versions()).toEqual(before);
    expect(admin).not.toHaveBeenCalled();
    expect(owner).not.toHaveBeenCalled();
    credit.mockRestore();
    await Promise.all(
      Array.from({ length: 5 }, () => service.fromPaidStatus(input)),
    );
    expect((await orders.findFirstByField("id", order.id)).status).toBe(
      "delivering",
    );
    expect(
      (await orders.findFirstByField("id", order.id))
        .subscriptionPeriodInvoiceId,
    ).toBe(invoice.id);
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("5000");
    expect(
      await grants.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subject.id }],
          },
        },
      }),
    ).toHaveLength(1);
    expect(admin).toHaveBeenCalledTimes(1);
    expect(owner).toHaveBeenCalledTimes(1);
    const after = await versions();
    expect(
      after.every((version, index) => BigInt(version) > BigInt(before[index])),
    ).toBe(true);

    const renewal = await invoices.insert({
      status: "open",
      amount: 0,
      provider: "dummy",
    });
    cleanup.push(() => invoices.deleteFirstByField("id", renewal.id));
    activeInvoices.push(renewal.id);
    const freshProps = async () => ({
      order: await readExtended(),
      extendedOrder: await readExtended(),
      subjectToEcommerceModuleOrder: {
        subjectId: subject.id,
        ecommerceModuleOrderId: activeOrderId,
      },
    });
    await (service as any).renewSubscription(await freshProps());
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("5000");
    await invoices.updateFirstByField("id", renewal.id, {
      ...renewal,
      status: "paid",
    });
    await Promise.all(
      [1, 2, 3].map(async () =>
        (service as any).renewSubscription(await freshProps()),
      ),
    );
    expect(
      (await orders.findFirstByField("id", order.id))
        .subscriptionPeriodInvoiceId,
    ).toBe(renewal.id);
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("10000");

    const secondOrder = await orders.insert({
      type: "history",
      status: "paid",
    });
    cleanup.push(() => orders.deleteFirstByField("id", secondOrder.id));
    const secondInvoice = await invoices.insert({
      status: "paid",
      amount: 0,
      provider: "dummy",
    });
    cleanup.push(() => invoices.deleteFirstByField("id", secondInvoice.id));
    activeOrderId = secondOrder.id;
    activeInvoices = [secondInvoice.id];
    await service.fromPaidStatus(await freshProps());
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("15000");
    expect((await orders.findFirstByField("id", order.id)).status).toBe(
      "delivering",
    );
    expect((await orders.findFirstByField("id", secondOrder.id)).status).toBe(
      "delivering",
    );

    const packOrder = await orders.insert({ type: "history", status: "paid" });
    cleanup.push(() => orders.deleteFirstByField("id", packOrder.id));
    const packInvoice = await invoices.insert({
      status: "paid",
      amount: 0,
      provider: "dummy",
    });
    cleanup.push(() => invoices.deleteFirstByField("id", packInvoice.id));
    activeOrderId = packOrder.id;
    activeInvoices = [packInvoice.id];
    quantity = 2;
    creditAmount = "1000";
    productType = "one_off";
    await Promise.all(
      [1, 2, 3].map(async () => service.fromPaidStatus(await freshProps())),
    );
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("17000");
    expect((await orders.findFirstByField("id", packOrder.id)).status).toBe(
      "approving",
    );

    activeOrderId = secondOrder.id;
    activeInvoices = [secondInvoice.id];
    productType = "subscription";
    quantity = 1;
    creditAmount = "5000";
    await orders.revokeSubscription({ id: secondOrder.id });
    await orders.updateFirstByField("id", secondOrder.id, { status: "paid" });
    await service.fromPaidStatus(await freshProps());
    expect((await balances.findById({ id: balance.id }))?.amount).toBe("17000");
  });
});

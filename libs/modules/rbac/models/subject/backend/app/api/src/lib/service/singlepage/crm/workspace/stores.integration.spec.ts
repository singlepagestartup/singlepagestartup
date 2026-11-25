import { Table as Invoice } from "@sps/billing/models/invoice/backend/repository/database";
import { eq } from "drizzle-orm";
import { Table as Intent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { randomUUID } from "node:crypto";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";
import { Table as SubjectTask } from "@sps/rbac/relations/subjects-to-crm-module-tasks/backend/repository/database";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { Table as FunnelTask } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";
import { STORE_EMPLOYEE_TRAINING_KEY_PREFIX } from "@sps/crm/models/task/sdk/model";
import { Table as Order } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as TaskOrder } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/repository/database";
import { Table as StoreOrder } from "@sps/ecommerce/relations/stores-to-orders/backend/repository/database";
import { createService } from "../../../../bootstrap";

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("counts the directory and overview records visible in each granted store", async () => {
  const rollback = new Error("Rollback workspace counts fixture");
  const test = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const subject = createService(createAppAssembly());
      const ecommerce = subject.modules.ecommerce;
      const store = await ecommerce.store.create({ data: {} });
      const owner = await subject.create({ data: {} });
      expect(await subject.crmWorkspace.stores(owner.id)).toEqual([]);
      const empty = await subject.ecommerceCatalog.mutation({
        subjectId: owner.id,
        data: {
          entity: "stores",
          method: "POST",
          data: { title: { ru: "Новый магазин" }, adminTitle: "Новый магазин" },
        },
      });
      expect(empty.slug).toEqual(expect.any(String));
      expect(empty.slug).not.toBe("");
      expect(await subject.crmWorkspace.stores(owner.id)).toEqual([
        expect.objectContaining({
          id: empty.id,
          slug: empty.slug,
          title: "Новый магазин",
          canManageProviderSettings: true,
          productCount: 0,
          employeeCount: 0,
        }),
      ]);
      await expect(
        subject.crmWorkspace.overview(owner.id, empty.id),
      ).resolves.toEqual({
        productCount: 0,
        orderCount: 0,
        taskCount: 0,
      });
      const manager = await subject.create({ data: {} });
      const agent = await subject.create({ data: { variant: "agent" } });
      const assistant = await subject.create({ data: { variant: "agent" } });
      const wrongKind = await subject.create({ data: {} });
      const grants = subject.module.subjectsToEcommerceModuleStores;
      for (const [subjectId, variant] of [
        [owner.id, "owner"],
        [manager.id, "crm-manager"],
        [manager.id, "crm-worker"],
        [agent.id, "crm-agent"],
        [assistant.id, "crm-agent"],
        [wrongKind.id, "crm-worker"],
        [wrongKind.id, "crm-agent"],
      ]) {
        await grants.create({
          data: { subjectId, ecommerceModuleStoreId: store.id, variant },
        });
      }
      const ownerGrants = await grants.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: owner.id },
              {
                column: "ecommerceModuleStoreId",
                method: "eq",
                value: empty.id,
              },
            ],
          },
        },
      });
      expect(ownerGrants.map(({ variant }) => variant)).toEqual(["owner"]);
      await grants.bindAssistant({
        subjectId: assistant.id,
        customerSubjectId: owner.id,
        ecommerceModuleStoreId: empty.id,
      });

      for (const variants of [
        ["default", "hidden"],
        ["provider"],
        ["archived"],
      ]) {
        const product = await ecommerce.product.create({
          data: { title: { ru: "Тариф SKU_%", de: "Sonderangebot" } },
        });
        for (const variant of variants) {
          await ecommerce.storesToProducts.create({
            data: {
              storeId: store.id,
              productId: product.id,
              sku: randomUUID(),
              variant,
            },
          });
        }
      }
      const [first, second, foreign] = await tx
        .insert(Funnel)
        .values(
          [store.id, store.id, empty.id].map((storeId) => ({
            storeId,
            name: "Store workflow",
            slug: randomUUID(),
            kind: "consultation" as const,
            definition: { initialStageId: "intake" },
            bindings: { formIds: [] },
          })),
        )
        .returning();
      const funnelQuery = { storeId: store.id, search: "STORE work", limit: 1 };
      const funnelPage = await subject.crmWorkspace.funnels(
        owner.id,
        funnelQuery,
      );
      expect(funnelPage).toMatchObject({ total: 2, nextOffset: 1 });
      expect(funnelPage.items).toHaveLength(1);
      const lastFunnel = await subject.crmWorkspace.funnels(owner.id, {
        ...funnelQuery,
        offset: 1,
      });
      expect(lastFunnel.total).toBe(2);
      expect(lastFunnel.nextOffset).toBeUndefined();
      expect(lastFunnel.nextCursor).toBeNull();
      expect([funnelPage.items[0].id, lastFunnel.items[0].id].sort()).toEqual(
        [first.id, second.id].sort(),
      );
      const cursorPage = await subject.crmWorkspace.funnels(owner.id, {
        ...funnelQuery,
        cursor: funnelPage.nextCursor!,
      });
      expect(cursorPage.items).toEqual(lastFunnel.items);
      expect(cursorPage.total).toBe(2);
      await expect(
        subject.crmWorkspace.funnels(owner.id, {
          ...funnelQuery,
          offset: 12,
        }),
      ).resolves.toMatchObject({ total: 2, items: [] });
      await expect(
        subject.crmWorkspace.funnels(owner.id, {
          ...funnelQuery,
          search: first.slug.toUpperCase(),
        }),
      ).resolves.toMatchObject({ total: 1, items: [{ id: first.id }] });
      await expect(
        subject.crmWorkspace.funnels(owner.id, {
          ...funnelQuery,
          search: foreign.slug,
        }),
      ).resolves.toMatchObject({ total: 0, items: [] });

      const employeeQuery = { storeId: store.id, offset: 0, limit: 1 };
      const staffPage = await subject.crmWorkspace.employeeList(
        owner.id,
        employeeQuery,
      );
      expect(staffPage).toMatchObject({ total: 2, nextOffset: 1 });
      const lastEmployee = await subject.crmWorkspace.employeeList(owner.id, {
        ...employeeQuery,
        offset: 1,
      });
      expect(lastEmployee.total).toBe(2);
      expect(lastEmployee.nextOffset).toBeUndefined();
      expect([staffPage.items[0].id, lastEmployee.items[0].id].sort()).toEqual(
        [manager.id, agent.id].sort(),
      );
      expect([...staffPage.items, ...lastEmployee.items]).toContainEqual({
        id: manager.id,
        name: manager.slug,
        kind: "human",
      });
      for (const [employee, profileVariant, kind] of [
        [manager, "telegram", "human"],
        [agent, "artificial-intelligence", "ai"],
      ] as const) {
        const fields = {
          title: { ru: "Ирина", en: "Irina", de: "Mitarbeiter" },
          subtitle: { en: "Store team" },
          variant: profileVariant,
          slug: randomUUID(),
        };
        const profile = await subject.modules.social.profile.create({
          data: { ...fields, description: { en: "Internal" } },
        });
        await subject.module.subjectsToSocialModuleProfiles.create({
          data: {
            subjectId: employee.id,
            socialModuleProfileId: profile.id,
            variant: "default",
          },
        });
        await expect(
          subject.crmWorkspace.employeeList(owner.id, {
            ...employeeQuery,
            search: fields.slug.toUpperCase(),
          }),
        ).resolves.toEqual({
          items: [{ id: employee.id, name: "Ирина", kind, profile: fields }],
          total: 1,
        });
      }
      await expect(
        subject.crmWorkspace.employeeList(owner.id, {
          ...employeeQuery,
          offset: 4,
          search: "MITARBEITER",
        }),
      ).resolves.toMatchObject({ items: [], total: 2 });
      await expect(
        subject.crmWorkspace.employeeList(owner.id, {
          ...employeeQuery,
          search: assistant.slug,
        }),
      ).resolves.toMatchObject({ total: 0, items: [] });
      await expect(
        subject.crmWorkspace.employeeList(owner.id, {
          ...employeeQuery,
          storeId: empty.id,
          search: "MITARBEITER",
        }),
      ).resolves.toMatchObject({ total: 0, items: [] });

      const tasks = await tx
        .insert(Task)
        .values(
          Array.from({ length: 104 }, (_, index) => ({
            stageId: "intake",
            status: index % 2 === 0 ? ("active" as const) : ("closed" as const),
            openingKey:
              index === 103
                ? STORE_EMPLOYEE_TRAINING_KEY_PREFIX + randomUUID()
                : randomUUID(),
            openingDigest: randomUUID(),
          })),
        )
        .returning({ id: Task.id });
      await tx.insert(SubjectTask).values(
        tasks.map(({ id }) => ({
          subjectId: owner.id,
          crmModuleTaskId: id,
          variant: "customer",
        })),
      );
      await tx.insert(FunnelTask).values(
        tasks.map((task, index) => ({
          taskId: task.id,
          funnelId:
            index === 102 ? foreign.id : [first.id, second.id][index % 2],
        })),
      );
      await tx.insert(FunnelTask).values([
        { taskId: tasks[0].id, funnelId: second.id, variant: "related" },
        { taskId: tasks[102].id, funnelId: first.id, variant: "related" },
      ]);

      const orderPrefix = randomUUID().slice(0, -3);
      const orders = await tx
        .insert(Order)
        .values(
          Array.from({ length: 103 }, (_, index) => ({
            id:
              index === 0 || index >= 100
                ? orderPrefix + index.toString(16).padStart(3, "0")
                : randomUUID(),
            status: index === 102 ? "new" : "paid",
          })),
        )
        .returning({ id: Order.id });
      await tx.insert(StoreOrder).values(
        orders.map(({ id }, index) => ({
          storeId: index === 101 ? empty.id : store.id,
          orderId: id,
        })),
      );
      await tx
        .insert(StoreOrder)
        .values({ storeId: store.id, orderId: orders[0].id });
      await expect(
        subject.crmWorkspace.overview(manager.id, empty.id),
      ).rejects.toThrow("Permission error");
      await expect(
        subject.crmWorkspace.overview(wrongKind.id, store.id),
      ).rejects.toThrow("Permission error");
      await expect(
        subject.crmWorkspace.overview(owner.id, empty.id),
      ).resolves.toEqual({
        productCount: 0,
        orderCount: 1,
        taskCount: 1,
      });
      const taskPage = await subject.crmWorkspace.tasks(owner.id, {
        storeId: store.id,
        limit: 100,
      });
      expect(taskPage.items).toHaveLength(100);
      const remainingTasks = await subject.crmWorkspace.tasks(owner.id, {
        storeId: store.id,
        cursor: taskPage.nextCursor!,
        limit: 100,
      });
      expect(remainingTasks.items).toHaveLength(2);
      const orderScope = { storeId: store.id, orderId: orders[0].id };
      await subject.module.subjectsToEcommerceModuleOrders.create({
        data: {
          subjectId: owner.id,
          ecommerceModuleOrderId: orderScope.orderId,
        },
      });
      await tx.insert(TaskOrder).values(
        [tasks[0], tasks[1], tasks[102], tasks[103]].map((task) => ({
          taskId: task.id,
          orderId: orderScope.orderId,
        })),
      );
      const detail = await subject.crmWorkspace.order(manager.id, orderScope);
      expect(detail.customers.map((customer) => customer.subjectId)).toEqual([
        owner.id,
      ]);
      expect(detail.tasks.map((task) => task.id).sort()).toEqual(
        [tasks[0].id, tasks[1].id].sort(),
      );
      await expect(
        subject.crmWorkspace.order(manager.id, {
          ...orderScope,
          orderId: orders[101].id,
        }),
      ).rejects.toThrow("Not Found");
      await expect(
        subject.crmWorkspace.order(manager.id, {
          ...orderScope,
          orderId: orders[102].id,
        }),
      ).rejects.toThrow("Not Found");
      await expect(
        subject.crmWorkspace.order(wrongKind.id, orderScope),
      ).rejects.toThrow("Permission error");
      await expect(
        subject.crmWorkspace.order(owner.id, {
          ...orderScope,
          orderId: orders[1].id,
        }),
      ).resolves.toMatchObject({ tasks: [], customers: [] });
      const buyer = { storeId: store.id, customerId: owner.id };
      const directory = { storeId: store.id, offset: 0, limit: 10 };
      await expect(
        subject.crmWorkspace.customers(manager.id, directory),
      ).resolves.toMatchObject({
        items: [{ subjectId: owner.id, orderCount: 1 }],
        total: 1,
      });
      await expect(
        subject.crmWorkspace.customer(manager.id, buyer),
      ).resolves.toMatchObject({
        subjectId: owner.id,
        orderCount: 1,
      });
      await expect(
        subject.crmWorkspace.customers(manager.id, {
          ...directory,
          search: owner.slug.toUpperCase(),
        }),
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        subject.crmWorkspace.orders(manager.id, {
          ...directory,
          customerId: owner.id,
        }),
      ).resolves.toMatchObject({
        items: [{ id: orderScope.orderId }],
        total: 1,
      });
      await expect(
        subject.crmWorkspace.customer(manager.id, {
          ...buyer,
          customerId: agent.id,
        }),
      ).rejects.toThrow("Not Found");
      await expect(
        subject.crmWorkspace.customers(wrongKind.id, directory),
      ).rejects.toThrow("Permission error");
      const orderPage = await subject.crmWorkspace.orders(owner.id, {
        storeId: store.id,
        offset: 100,
        limit: 100,
      });
      expect(orderPage.items).toHaveLength(1);
      expect(orderPage.total).toBe(101);
      const orderSearch = {
        storeId: store.id,
        limit: 1,
        search: orderPrefix.toUpperCase(),
      };
      const firstOrder = await subject.crmWorkspace.orders(manager.id, {
        ...orderSearch,
        offset: 0,
      });
      const secondOrder = await subject.crmWorkspace.orders(manager.id, {
        ...orderSearch,
        offset: 1,
      });
      expect(firstOrder).toMatchObject({ total: 2, nextOffset: 1 });
      expect(secondOrder).toMatchObject({ total: 2, nextOffset: undefined });
      expect(
        [...firstOrder.items, ...secondOrder.items].map(({ id }) => id).sort(),
      ).toEqual([orders[0].id, orders[100].id].sort());
      await expect(
        subject.crmWorkspace.orders(manager.id, { ...orderSearch, offset: 2 }),
      ).resolves.toMatchObject({ total: 2, items: [] });
      await expect(
        subject.crmWorkspace.orders(manager.id, {
          ...orderSearch,
          offset: 0,
          search: "%",
        }),
      ).resolves.toMatchObject({ total: 0, items: [] });
      await expect(
        subject.crmWorkspace.orders(manager.id, {
          ...orderSearch,
          offset: 0,
          storeId: empty.id,
        }),
      ).rejects.toThrow("Permission error");
      const firstProduct = await subject.storeProducts.list(
        owner.id,
        store.id,
        0,
        1,
        "sku_%",
      );
      const secondProduct = await subject.storeProducts.list(
        owner.id,
        store.id,
        1,
        1,
        "sku_%",
      );
      expect(firstProduct).toMatchObject({ total: 2, nextOffset: 1 });
      expect(secondProduct).toMatchObject({ total: 2, nextOffset: undefined });
      expect(
        new Set([
          firstProduct.items[0].product.id,
          secondProduct.items[0].product.id,
        ]).size,
      ).toBe(2);
      await expect(
        subject.storeProducts.list(manager.id, store.id, 1, 1, "sonDerAngebot"),
      ).resolves.toMatchObject({ total: 1, items: [] });
      await expect(
        subject.storeProducts.list(owner.id, store.id, 0, 1, "sku__"),
      ).resolves.toMatchObject({ total: 0, items: [] });
      await expect(
        subject.storeProducts.list(manager.id, empty.id, 0, 1, "sku_%"),
      ).rejects.toThrow("Permission error");
      for (const [actor, expectedProducts] of [
        [owner, 2],
        [manager, 1],
      ] as const) {
        const stores = await subject.crmWorkspace.stores(actor.id);
        const products = await subject.storeProducts.list(
          actor.id,
          store.id,
          0,
        );
        const employees = await subject.crmWorkspace.employeeList(actor.id, {
          storeId: store.id,
          offset: 0,
          limit: 100,
        });
        expect(products.items).toHaveLength(expectedProducts);
        expect(products.total).toBe(expectedProducts);
        await expect(
          subject.crmWorkspace.overview(actor.id, store.id),
        ).resolves.toEqual({
          productCount: expectedProducts,
          orderCount: 101,
          taskCount: 102,
        });
        expect(employees.items.map(({ id }) => id).sort()).toEqual(
          [manager.id, agent.id].sort(),
        );
        expect(stores.find(({ id }) => id === store.id)).toMatchObject({
          productCount: products.items.length,
          employeeCount: employees.items.length,
        });
        if (actor.id === owner.id) {
          expect(stores.find(({ id }) => id === empty.id)).toMatchObject({
            productCount: 0,
            employeeCount: 0,
          });
        } else {
          expect(stores.map(({ id }) => id)).toEqual([store.id]);
        }
      }
      throw rollback;
    }),
  );
  await expect(test).rejects.toBe(rollback);
});

it("isolates physical items, delivery and each store's share of a paid invoice", async () => {
  const rollback = new Error("Rollback physical order fixture");
  await expect(
    getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const subject = createService(createAppAssembly());
        const { ecommerce, billing } = subject.modules;
        const [merchant, manager] = await Promise.all([
          subject.create({ data: {} }),
          subject.create({ data: {} }),
        ]);
        const ownStore = await ecommerce.store.create({ data: {} });
        const otherStore = await ecommerce.store.create({ data: {} });
        for (const [subjectId, variant] of [
          [merchant.id, "owner"],
          [manager.id, "crm-manager"],
        ]) {
          await subject.module.subjectsToEcommerceModuleStores.create({
            data: { subjectId, ecommerceModuleStoreId: ownStore.id, variant },
          });
        }
        const order = await ecommerce.order.create({
          data: { status: "paid", comment: "Notes for both shipments" },
        });
        const currency = await billing.currency.create({
          data: { slug: randomUUID(), title: "Test currency", symbol: "TC" },
        });
        const [paymentIntent] = await tx
          .insert(Intent)
          .values({
            status: "processing",
            amount: 90,
            checkoutCurrencyId: currency.id,
          })
          .returning();
        const invoice = await billing.invoice.create({
          data: { status: "paid", amount: 90, provider: "dummy" },
        });
        await billing.paymentIntentsToInvoices.create({
          data: { invoiceId: invoice.id, paymentIntentId: paymentIntent.id },
        });
        for (const [store, amount, address, quantity] of [
          [ownStore, "16.75", "Gate A", 2],
          [otherStore, "73.25", "Gate B", 3],
        ] as const) {
          await ecommerce.storesToOrders.create({
            data: { storeId: store.id, orderId: order.id },
          });
          const product = await ecommerce.product.create({
            data: { kind: "physical", title: { en: address } },
          });
          const offer = await ecommerce.storesToProducts.create({
            data: {
              storeId: store.id,
              productId: product.id,
              sku: randomUUID(),
            },
          });
          const line = await ecommerce.ordersToProducts.create({
            data: {
              orderId: order.id,
              offerId: offer.id,
              productId: product.id,
              quantity,
              destination: { address },
            },
          });
          await ecommerce.order.ordersToBillingModulePaymentIntents.create({
            data: {
              orderId: order.id,
              billingModulePaymentIntentId: paymentIntent.id,
              orderLineId: line.id,
              offerId: offer.id,
              purchaseSnapshot: {
                version: 1,
                currencyId: currency.id,
                amount,
                orderAmount: "90",
                purchaseType: "one_off",
                parentLineId: null,
                quoteVersion: "checkout",
                quoteExpiresAt: "2030-01-01T00:00:00.000Z",
                destination: { address },
                charge: {
                  storeId: store.id,
                  providerStoreId: store.id,
                  offerId: offer.id,
                  productId: product.id,
                  role: "product",
                  recurrence: "first",
                  quantity,
                  stockQuantity: null,
                  amount,
                  formula: "fixed",
                  formulaVersion: "1",
                  inputs: {},
                },
              },
            },
          });
        }
        const buyer = await subject.create({ data: {} });
        await subject.module.subjectsToEcommerceModuleOrders.create({
          data: { subjectId: buyer.id, ecommerceModuleOrderId: order.id },
        });
        const page = {
          storeId: ownStore.id,
          customerId: buyer.id,
          offset: 0,
          limit: 10,
        };
        const ownerOrders = await subject.crmWorkspace.orders(
          merchant.id,
          page,
        );
        expect(ownerOrders.items).toMatchObject([
          {
            id: order.id,
            items: [{ product: { title: { en: "Gate A" } }, quantity: 2 }],
            total: { amount: 16.75, symbol: "TC" },
          },
        ]);
        const managerOrders = await subject.crmWorkspace.orders(
          manager.id,
          page,
        );
        expect(managerOrders.items[0].items).toEqual(
          ownerOrders.items[0].items,
        );
        expect(managerOrders.items[0]).not.toHaveProperty("total");
        const scope = { storeId: ownStore.id, orderId: order.id };
        const before = await subject.crmWorkspace.order(merchant.id, scope);
        expect(before.lines).toMatchObject([
          { quantity: 2, destination: { address: "Gate A" } },
        ]);
        expect(before.comment).toBeNull();
        expect(before.payments).toMatchObject([
          {
            id: paymentIntent.id,
            amount: 16.75,
            paid: null,
            currency: "TC",
            invoices: [{ id: invoice.id, status: "paid" }],
          },
        ]);
        const limited = await subject.crmWorkspace.order(manager.id, scope);
        expect(limited.payments).toBeUndefined();
        await tx
          .update(Intent)
          .set({ status: "succeeded" })
          .where(eq(Intent.id, paymentIntent.id));
        const confirmed = await subject.crmWorkspace.order(merchant.id, scope);
        expect(confirmed.payments).toMatchObject([
          { status: "succeeded", paid: 16.75 },
        ]);
        const otherCurrency = await billing.currency.create({
          data: { slug: randomUUID(), title: "Another currency", symbol: "AC" },
        });
        await tx
          .update(Intent)
          .set({ checkoutCurrencyId: otherCurrency.id })
          .where(eq(Intent.id, paymentIntent.id));
        const conflictingCurrency = await subject.crmWorkspace.order(
          merchant.id,
          scope,
        );
        expect(conflictingCurrency.payments).toMatchObject([
          { amount: null, currency: null, paid: null },
        ]);
        await tx
          .update(Intent)
          .set({ checkoutCurrencyId: currency.id })
          .where(eq(Intent.id, paymentIntent.id));
        await tx
          .update(Invoice)
          .set({ amount: 89 })
          .where(eq(Invoice.id, invoice.id));
        const inconsistent = await subject.crmWorkspace.order(
          merchant.id,
          scope,
        );
        expect(inconsistent.payments).toMatchObject([
          { amount: 16.75, paid: null },
        ]);
        throw rollback;
      }),
    ),
  ).rejects.toBe(rollback);
});

it("pages funnel product names within one store without fetching its catalogue for the editor", async () => {
  const rollback = new Error("Rollback funnel product selector fixture");
  await expect(
    getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const subject = createService(createAppAssembly());
        const ecommerce = subject.modules.ecommerce;
        const store = await ecommerce.store.create({ data: {} });
        const other = await ecommerce.store.create({ data: {} });
        const owner = await subject.create({ data: {} });
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: owner.id,
            ecommerceModuleStoreId: store.id,
            variant: "owner",
          },
        });
        async function product(
          storeId: string,
          title: { ru: string; en: string },
          variant = "default",
          initialGrant = false,
        ) {
          const item = await ecommerce.product.create({
            data: { title, slug: randomUUID() },
          });
          await ecommerce.storesToProducts.create({
            data: {
              storeId,
              productId: item.id,
              sku: randomUUID(),
              variant,
              settings: { initialGrant },
            },
          });
          return item;
        }
        const flower = await product(store.id, {
          ru: "Картина с цветами",
          en: "Floral canvas",
        });
        const forest = await product(
          store.id,
          { ru: "Картина леса", en: "Forest canvas" },
          "hidden",
        );
        await ecommerce.storesToProducts.create({
          data: {
            storeId: store.id,
            productId: flower.id,
            sku: randomUUID(),
            variant: "hidden",
          },
        });
        await product(
          store.id,
          { ru: "Картина за бонусы", en: "Grant canvas" },
          "default",
          true,
        );
        await product(
          store.id,
          { ru: "Картина в архиве", en: "Archived canvas" },
          "archived",
        );
        await product(other.id, { ru: "Картина соседа", en: "Foreign canvas" });
        const offerRead = jest.spyOn(ecommerce.storesToProducts, "find");
        const options = await subject.crmWorkspace.options(
          owner.id,
          store.id,
          false,
        );
        expect(options.products).toBeUndefined();
        expect(options.offers).toBeUndefined();
        expect(offerRead).not.toHaveBeenCalled();
        const query = {
          storeId: store.id,
          offset: 0,
          limit: 1,
          language: "ru" as const,
          search: "Картина",
        };
        const first = await subject.crmWorkspace.funnelProducts(
          owner.id,
          query,
        );
        const next = await subject.crmWorkspace.funnelProducts(owner.id, {
          ...query,
          offset: 1,
        });
        expect(first.total).toBe(2);
        expect(next.total).toBe(2);
        expect([...first.items, ...next.items]).toEqual(
          [flower, forest]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((item) => ({ id: item.id, title: item.title?.ru })),
        );
        await expect(
          subject.crmWorkspace.funnelProducts(owner.id, {
            ...query,
            language: "en",
            search: "floRAL",
          }),
        ).resolves.toEqual({
          items: [{ id: flower.id, title: "Floral canvas" }],
          total: 1,
        });
        await expect(
          subject.crmWorkspace.funnelProducts(owner.id, {
            ...query,
            search: flower.slug,
          }),
        ).resolves.toEqual({ items: [], total: 0 });
        await expect(
          subject.crmWorkspace.funnelProducts(owner.id, {
            ...query,
            storeId: other.id,
          }),
        ).rejects.toThrow(/Store CRM access/);
        throw rollback;
      }),
    ),
  ).rejects.toBe(rollback);
});

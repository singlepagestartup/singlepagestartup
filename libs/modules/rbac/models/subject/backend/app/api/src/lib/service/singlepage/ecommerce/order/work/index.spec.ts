import { Service } from "./index";
import type { Service as Subject } from "../../../index";

it("routes an open renewal invoice to its buyer's existing order chat", async () => {
  const parent = { id: "first" };
  const renewal = { id: "renewal", subscriptionSourceOrderId: parent.id };
  const task = { id: "task", customerId: "buyer" };
  const invoice = {
    id: "open-invoice",
    status: "open",
    paymentUrl: "https://example.test/pay",
  };
  const findByIdExtended = jest.fn().mockResolvedValue({
    ...renewal,
    status: "paying",
    ordersToBillingModulePaymentIntents: [
      {
        billingModulePaymentIntent: {
          paymentIntentsToInvoices: [
            { invoice },
            { invoice: { ...invoice, status: "void", id: "void-invoice" } },
          ],
        },
      },
    ],
  });
  const postOrderNotice = jest.fn();
  const subject = {
    modules: {
      ecommerce: {
        order: {
          findById: jest.fn(({ id }) =>
            Promise.resolve(id === renewal.id ? renewal : parent),
          ),
          findByIdExtended,
          repository: { withLifecycleLock: jest.fn((_id, run) => run()) },
        },
      },
      crm: {
        task: {
          find: jest.fn(({ params }) =>
            Promise.resolve(
              params.filters.and.some(
                (filter: { column: string; value: string }) =>
                  filter.column === "orderId" && filter.value === parent.id,
              )
                ? [task]
                : [],
            ),
          ),
        },
      },
    },
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest.fn().mockResolvedValue([{ subjectId: "buyer" }]),
      },
    },
    customerWork: {
      workspaceChannel: jest.fn().mockResolvedValue({ threadId: "thread" }),
      postOrderNotice,
    },
  };
  const service = new Service(subject as unknown as Subject);
  await service.postRenewalInvoice(renewal.id, "another-customer");
  expect(postOrderNotice).not.toHaveBeenCalled();
  await service.postRenewalInvoice(renewal.id, task.customerId);
  await service.postRenewalInvoice(renewal.id, task.customerId);
  const expected = [
    task,
    expect.objectContaining({
      key: "order-renewal:open-invoice",
      interaction: {
        inline_keyboard: [[{ text: "Оплатить счёт", url: invoice.paymentUrl }]],
      },
    }),
  ];
  expect(postOrderNotice.mock.calls).toEqual([expected, expected]);
  findByIdExtended.mockResolvedValue({ ...renewal, status: "paid" });
  await service.postRenewalInvoice(renewal.id, task.customerId);
  expect(postOrderNotice).toHaveBeenCalledTimes(2);
});

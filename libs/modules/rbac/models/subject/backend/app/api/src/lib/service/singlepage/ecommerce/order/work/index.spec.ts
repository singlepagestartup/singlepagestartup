import { Service } from "./index";
import type { Service as Subject } from "../../../index";
import { pdfOrderResult } from "./utils";

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

it("renders legacy business brief text under the preview ID while keeping the original and other services private", async () => {
  const text =
    "Исходные факты о работе.\n".repeat(35) + "Полное уточнение в конце брифа.";
  const { original, preview } = await pdfOrderResult("legacy", text);
  const file = {
    operationKey: "work-result:legacy",
    id: "preview",
    previewName: preview.name,
    previewFileId: "preview",
    previewMimeType: "application/pdf",
    originalFileId: "original",
    originalMimeType: "application/pdf",
  };
  const work = {
    kind: "individual-service",
    state: "awaiting-result",
    orderId: "order",
    customerId: "buyer",
    taskId: "task",
    storeId: "store",
    files: [file],
    decisions: [],
    fulfillment: [],
  };
  const offer = {
    id: "offer",
    storeId: "store",
    productId: "product",
    settings: { closedForNewOrders: true, fullTextDraftPreview: true },
  };
  const line = { orderId: "order", offerId: "offer", productId: "product" };
  const findOffer = jest.fn().mockResolvedValue(offer);
  const findLines = jest.fn().mockResolvedValue([line]);
  const readPrivate = jest.fn(async ({ id }) =>
    id === "original" ? original : preview,
  );
  const subject = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
    modules: {
      crm: {
        task: {
          findById: jest.fn().mockResolvedValue({
            ...work,
            productId: "product",
            offerId: "offer",
          }),
        },
      },
      ecommerce: {
        order: {
          work: {
            findByOrder: jest.fn().mockResolvedValue(work),
            read: jest.fn().mockResolvedValue(work),
          },
        },
        storesToProducts: { findById: findOffer },
        ordersToProducts: { find: findLines },
      },
      fileStorage: { file: { privateContent: { findById: readPrivate } } },
    },
  };
  const service = new Service(subject as unknown as Subject);
  const view = await service.read("buyer", work);
  expect(view.files[0]).toMatchObject({
    id: file.previewFileId,
    previewMimeType: "text/plain",
  });
  const draft = await service.artifact("buyer", "order", "preview", "GET");
  expect(draft).toMatchObject({ id: "preview", mimeType: "text/plain" });
  expect(Buffer.from(draft.bytes).toString()).toContain(
    "Полное уточнение в конце брифа.",
  );
  expect(Buffer.from(draft.bytes).toString()).not.toContain("ПРЕДПРОСМОТР");

  readPrivate.mockClear();
  await expect(
    service.artifact("buyer", "order", "original", "GET"),
  ).rejects.toThrow("Order artifact does not exist");
  expect(readPrivate).not.toHaveBeenCalled();
  findOffer.mockResolvedValueOnce({
    ...offer,
    settings: { closedForNewOrders: true },
  });
  await expect(
    service.artifact("buyer", "order", "preview", "GET"),
  ).resolves.toBe(preview);
  expect(readPrivate).toHaveBeenCalledWith({ id: "preview" });
  readPrivate.mockClear();
  findLines.mockResolvedValueOnce([{ ...line, offerId: "another-offer" }]);
  await expect(
    service.artifact("buyer", "order", "preview", "GET"),
  ).resolves.toBe(preview);
  expect(readPrivate.mock.calls).toEqual([[{ id: "preview" }]]);
});

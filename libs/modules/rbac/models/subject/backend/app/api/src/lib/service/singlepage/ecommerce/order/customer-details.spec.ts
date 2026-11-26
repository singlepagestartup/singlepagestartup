import { Service } from "./customer-details";

function fixture() {
  const line = {
    id: "line",
    orderId: "order",
    productId: "product",
    quantity: 1,
  };
  const ecommerce = {
    order: { work: { statesForCustomer: jest.fn().mockResolvedValue([]) } },
    ordersToProducts: { find: jest.fn().mockResolvedValue([line]) },
    ordersToBillingModulePaymentIntents: {
      find: jest.fn().mockResolvedValue([]),
    },
    product: { find: jest.fn().mockResolvedValue([]) },
  };
  const service = {
    modules: { ecommerce },
    customerWork: {
      discussionForOrder: jest.fn().mockResolvedValue({
        taskId: "private",
        chatId: "chat",
        threadId: "thread",
      }),
      assertChatAccess: jest.fn(),
    },
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(),
  };
  return {
    line,
    ecommerce,
    service,
    reader: new Service({ service: service as never }),
  };
}
const subjectId = "subject";

describe("Customer order details", () => {
  it("reads saved quantities, purchase labels, and old lines in bulk", async () => {
    const { reader, ecommerce, line, service } = fixture();
    ecommerce.ordersToProducts.find.mockResolvedValue([
      line,
      { id: "old", orderId: "historical", productId: "legacy", quantity: 3 },
      {
        id: "unavailable",
        orderId: "historical",
        productId: "removed",
        quantity: 4,
      },
    ]);
    ecommerce.product.find.mockResolvedValue([
      { id: "product", title: { en: "Renamed service" } },
      { id: "legacy", title: { en: "Print", ru: "Печать" } },
    ]);
    ecommerce.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      {
        orderId: "order",
        orderLineId: "line",
        purchaseSnapshot: {
          charge: {
            productId: "product",
            title: "Original service",
            quantity: 2,
          },
        },
      },
    ]);
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order", "historical", "empty"],
    });
    expect(result.get("order")).toEqual({
      lines: [
        {
          id: "line",
          productId: "product",
          title: { und: "Original service" },
          quantity: 2,
        },
      ],
    });
    expect(result.get("historical")).toEqual({
      lines: [
        {
          id: "old",
          productId: "legacy",
          title: { en: "Print", ru: "Печать" },
          quantity: 3,
        },
        { id: "unavailable", productId: "removed", title: {}, quantity: 4 },
      ],
    });
    expect(result.get("empty")).toEqual({ lines: [] });
    expect(ecommerce.product.find).toHaveBeenCalledTimes(1);
    expect(service.customerWork.discussionForOrder).not.toHaveBeenCalled();
  });

  it("returns the service state for both the history list and the selected order", async () => {
    const { reader, ecommerce } = fixture();
    ecommerce.order.work.statesForCustomer.mockResolvedValue([
      { orderId: "order", state: "awaiting-result" },
    ]);
    for (const requestedOrderId of [undefined, "order"]) {
      const result = await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order", "old"],
        requestedOrderId,
      });
      expect(ecommerce.order.work.statesForCustomer).toHaveBeenCalledWith(
        subjectId,
        ["order", "old"],
      );
      expect(result.get("order")?.workState).toBe("awaiting-result");
      expect(result.get("old")?.workState).toBeUndefined();
    }
  });

  it("returns only the identifiers of the authorized task thread", async () => {
    const { reader, service } = fixture();
    const details = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
      requestedOrderId: "order",
    });
    expect(service.customerWork.discussionForOrder).toHaveBeenCalledWith({
      customerId: subjectId,
      orderId: "order",
    });
    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({ subjectId, socialModuleChatId: "chat" });
    expect(service.customerWork.assertChatAccess).toHaveBeenCalledWith({
      subjectId,
      chatId: "chat",
      threadId: "thread",
      edit: false,
    });
    expect(details.get("order")?.discussion).toEqual({
      chatId: "chat",
      threadId: "thread",
    });
  });

  it.each(["no task", "no membership", "no thread access"])(
    "keeps the order when there is %s",
    async (condition) => {
      const { reader, service, line } = fixture();
      if (condition === "no task") {
        service.customerWork.discussionForOrder.mockResolvedValue(undefined);
      } else if (condition === "no membership") {
        service.socialModuleChatLifecycleAssertSubjectOwnsChat.mockRejectedValue(
          new Error("Authorization error. Not a participant"),
        );
      } else {
        service.customerWork.assertChatAccess.mockRejectedValue(
          new Error("Not Found error. Unavailable"),
        );
      }
      const details = await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order"],
        requestedOrderId: "order",
      });
      expect(details.get("order")).toEqual({
        lines: [
          {
            id: line.id,
            productId: line.productId,
            quantity: line.quantity,
            title: {},
          },
        ],
      });
    },
  );

  it("skips all dependent reads for an exact order outside the owned history", async () => {
    const { reader, service, ecommerce } = fixture();
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: [],
      requestedOrderId: "foreign",
    });
    expect(result.size).toBe(0);
    expect(ecommerce.ordersToProducts.find).not.toHaveBeenCalled();
    expect(service.customerWork.discussionForOrder).not.toHaveBeenCalled();
  });
});

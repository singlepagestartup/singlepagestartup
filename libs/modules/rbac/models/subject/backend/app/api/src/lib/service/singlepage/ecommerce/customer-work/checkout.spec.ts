import { randomUUID } from "node:crypto";
import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type { IOrderWork } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as Message } from "@sps/social/models/message/sdk/model";
import type { Service as Subject } from "../../index";
import { OrderChatCheckout } from "./checkout";

function fixture() {
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    orderId: randomUUID(),
    customerId: randomUUID(),
    stageId: "payment",
    assigneeKind: "ai",
    assigneeId: randomUUID(),
    status: "active",
  } as Task;
  const stage = {
    id: task.stageId,
    name: "Оплата заказа",
    behavior: "ecommerce-module-order-payment",
    actions: [],
  } as unknown as IFunnelStage;
  const fileId = randomUUID();
  const work = {
    kind: "individual-service",
    orderId: task.orderId,
    taskId: task.id,
    storeId: task.storeId,
    customerId: task.customerId,
    state: "awaiting-payment",
    acceptedFileId: fileId,
    files: [{ id: fileId, currencyId: "rub", price: "500.00000000" }],
  } as IOrderWork;
  const messages = new Map<string, Message>();
  const saved: (string | null)[] = [];
  const invoice = {
    status: "pending",
    provider: "stripe",
    paymentUrl: "https://payments.example/order",
  };
  const checkout = jest
    .fn()
    .mockResolvedValue({ billingModule: { invoices: [invoice] } });
  let locked = false;
  const subject = {
    modules: {
      crm: {
        task: {
          getFunnel: async () => ({ definition: { stages: [stage] } }),
          withTask: async (_: unknown, fn: (task: Task) => Promise<unknown>) =>
            fn(task),
        },
      },
      ecommerce: {
        order: {
          work: {
            findByOrder: async () => work,
            withOrderLock: async (_: string, run: () => Promise<void>) => run(),
          },
          repository: {
            patchFulfillment: async (_: string, patch: Partial<IOrderWork>) =>
              Object.assign(work, patch),
          },
        },
      },
      billing: {
        currency: { findById: async () => ({ symbol: "₽" }) },
        paymentIntent: {
          isProviderAllowed: ({ provider }: { provider: string }) =>
            ["stripe", "paykeeper"].includes(provider),
        },
      },
      social: {
        message: {
          findById: async ({ id }: { id: string }) => messages.get(id),
        },
      },
    },
    repository: {
      withSubjectLock: async (_: unknown, fn: () => Promise<unknown>) => {
        locked = true;
        try {
          return await fn();
        } finally {
          locked = false;
        }
      },
    },
    ecommerceModuleOrderAssertAccess: jest.fn(),
    deanonymize: jest.fn(),
    ecommerceOrderCheckout: (request: unknown) => {
      expect(locked).toBe(false);
      return checkout(request);
    },
  } as unknown as Subject;
  const service = new OrderChatCheckout(subject, async (_, text, rows) => {
    const id = randomUUID();
    const message = {
      id,
      variant: "customer-work",
      description: text,
      workReplyKey: "order-checkout:" + id,
      interaction: rows ? { inline_keyboard: rows } : undefined,
    } as Message;
    messages.set(id, message);
    saved.push(text);
    return message;
  });
  const run = (
    input: Parameters<typeof service.execute>[1]["input"],
    owner = task.customerId,
  ) =>
    service.execute(owner, {
      input,
      storeId: task.storeId,
      taskId: task.id,
      operationKey: randomUUID(),
      operation: "chat-checkout",
    });
  const click = (
    value: string,
    messageId = work.paymentConversation!.promptId,
  ) => run({ kind: "button", messageId, value });
  const answer = async (text: string) => {
    const ctx = await service.context(task, stage);
    const id = randomUUID();
    const message = { id, description: text } as Message;
    messages.set(id, message);
    await service.answer(ctx!, work.paymentConversation!, message);
  };
  return { run, click, answer, work, task, checkout, messages, saved, invoice };
}

it.each([true, false])(
  "accepts and prices once, validates email, supports back, and sends the exact order to checkout (skip comment: %s)",
  async (skip) => {
    const f = fixture();
    await f.run({ kind: "begin" });
    await f.run({ kind: "begin" });
    expect(f.saved).toEqual([
      "Файл принят. К оплате 500 ₽.",
      "Выберите способ оплаты.",
    ]);
    const first = f.work.paymentConversation!.promptId;
    expect(
      f.messages
        .get(first)
        ?.interaction?.inline_keyboard.flat()
        .map((b: { text: string }) => b.text),
    ).toEqual(["Stripe", "PayKeeper"]);
    await expect(f.click("method:dummy")).rejects.toThrow(
      "Unknown checkout button",
    );
    await f.click("method:paykeeper");
    await f.answer("incorrect");
    expect(f.work.paymentConversation!.step).toBe("email");
    await f.click("back");
    await f.click("method:stripe", first);
    expect(f.work.paymentConversation!.step).toBe("method");
    await f.click("method:stripe");
    await f.answer("buyer@example.org");
    if (skip) {
      await f.click("skip");
    } else {
      await f.answer("Нужен электронный чек.");
    }
    expect(f.checkout).not.toHaveBeenCalled();
    const ready = f.work.paymentConversation!.promptId;
    f.checkout.mockRejectedValueOnce(new Error("Provider unavailable"));
    await expect(f.click("pay")).rejects.toThrow("Provider unavailable");
    expect(f.work.paymentConversation!.promptId).toBe(ready);
    expect(await f.click("pay")).toBe(f.invoice.paymentUrl);
    expect(f.checkout).toHaveBeenLastCalledWith({
      id: f.task.customerId,
      provider: "stripe",
      email: "buyer@example.org",
      comment: skip ? undefined : "Нужен электронный чек.",
      ecommerceModule: { orders: [{ id: f.task.orderId }] },
    });
    expect(
      f.messages.get(f.work.paymentConversation!.promptId)?.interaction
        ?.inline_keyboard[0][0].url,
    ).toBe(f.invoice.paymentUrl);
    await f.click("pay", ready);
    expect(f.checkout).toHaveBeenCalledTimes(2);
  },
);

it("does not open payment for a different buyer, a paid order, or a file invalidated after acceptance", async () => {
  const f = fixture();
  await expect(f.run({ kind: "begin" }, randomUUID())).rejects.toThrow(
    "Order not found",
  );
  f.work.files[0].invalidatedByCartEdit = true;
  await f.run({ kind: "begin" });
  delete f.work.files[0].invalidatedByCartEdit;
  f.work.state = "paid";
  await f.run({ kind: "begin" });
  expect(f.saved).toHaveLength(0);
  expect(f.checkout).not.toHaveBeenCalled();
});

it("waits for the payment notification once an invoice has already settled", async () => {
  const f = fixture();
  f.invoice.status = "paid";
  await f.run({ kind: "begin" });
  await f.click("method:stripe");
  await f.answer("buyer@example.org");
  await f.click("skip");
  const button = f.work.paymentConversation!.promptId;
  await f.click("pay", button);
  await f.click("pay", button);
  expect(f.checkout).toHaveBeenCalledTimes(1);
  expect(f.work.paymentConversation!.step).toBe("confirming");
});

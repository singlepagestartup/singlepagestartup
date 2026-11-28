import { randomUUID } from "node:crypto";
import {
  customerWorkRateCallback,
  customerWorkRatePromptKey,
  readCustomerWorkRatePrompt,
} from "@sps/rbac/models/subject/sdk/model";
import { Service } from ".";
import { customerWorkRateNotice } from "./utils";
import { withSocialMessageSystemMetadata } from "@sps/social/models/message/sdk/model";
import {
  orderFileReviewInteraction,
  orderFileRevisionPromptKey,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import type { IModel as ITask } from "@sps/crm/models/task/sdk/model";
import type { IOrderPaymentConversation } from "@sps/ecommerce/models/order/sdk/model";

function fixture() {
  const taskId = randomUUID();
  const messageId = randomUUID();
  const priceKey = "c".repeat(64);
  const chatId = randomUUID();
  const threadId = randomUUID();
  const customerId = randomUUID();
  const storeId = randomUUID();
  const message = {
    id: messageId,
    variant: "customer-work",
    workReplyKey: customerWorkRatePromptKey(taskId, 2, priceKey),
    metadata: { customerWorkRatePrompt: { taskId, priceKey } },
    interaction: {
      inline_keyboard: [
        [
          {
            text: "Подтвердить тариф",
            callback_data: customerWorkRateCallback(messageId),
          },
        ],
      ],
    },
  };
  const delivery = { reciever: "1234", sourceSystemId: "5678", status: "sent" };
  const owners = jest.fn().mockResolvedValue([{ subjectId: customerId }]);
  const members = jest.fn().mockResolvedValue([{ profileId: "buyer-profile" }]);
  const authenticationMe = jest.fn().mockResolvedValue({ authenticated: true });
  const decideCustomerWorkAction = jest.fn();
  const channels = jest.fn().mockResolvedValue([{ chatId, threadId }]);
  const getFunnel = jest.fn().mockResolvedValue({ definition: { stages: [] } });
  const service = new Service({
    authenticationMe,
    providerConnections: { decideCustomerWorkAction },
    module: {
      identity: {
        find: async () => [{ id: "telegram-identity", usage: "login" }],
      },
      subjectsToIdentities: { find: owners },
      subjectsToSocialModuleProfiles: {
        find: async () => [
          { variant: "default", socialModuleProfileId: "buyer-profile" },
        ],
      },
    },
    modules: {
      billing: { paymentIntent: { isProviderAllowed: () => true } },
      crm: {
        task: {
          findById: async () => ({ id: taskId, customerId, storeId }),
          getFunnel,
        },
      },
      notification: { notification: { findById: async () => delivery } },
      social: {
        profilesToChats: { find: members },
        message: { findById: async () => message },
        chat: {
          findById: async () => ({
            id: chatId,
            variant: "telegram",
            sourceSystemId: "1234",
          }),
        },
        chatsToCrmModuleTasks: { channels },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const execute = jest.spyOn(service, "execute").mockResolvedValue({} as never);
  return {
    service,
    execute,
    owners,
    members,
    authenticationMe,
    decideCustomerWorkAction,
    channels,
    getFunnel,
    customerId,
    message,
    taskId,
    priceKey,
    storeId,
    channel: { chatId, threadId },
    input: {
      messageId,
      telegramChatId: delivery.reciever,
      telegramMessageId: delivery.sourceSystemId,
    },
  };
}

function chatDecisionFixture() {
  const f = fixture();
  const internals = f.service as unknown as {
    chatDecision: (input: {
      text: string;
      task: object;
      channel: object;
      funding: object;
      telegramReplyToMessageId?: string;
      checkoutState?: IOrderPaymentConversation;
      mayDispatchCheckout: boolean;
      hasAttachments?: boolean;
    }) => Promise<unknown>;
    currentReviewFile: () => Promise<{ previewFileId: string } | undefined>;
    matchesReviewPrompt: (
      task: object,
      channel: object,
      entry: object,
      fileId: string,
    ) => Promise<boolean>;
    customerProfiles: () => Promise<Set<string>>;
    messagePage: (
      threadId: string,
      page: { limit: number; offset: number },
    ) => Promise<{ entries: object[]; hasNextPage: boolean }>;
    price: () => Promise<{ key: string; rates: [] }>;
    spendingApproval: () => Promise<undefined>;
    assertRatePrompt: () => Promise<void>;
  };
  jest
    .spyOn(internals, "customerProfiles")
    .mockResolvedValue(new Set(["buyer-profile"]));
  jest
    .spyOn(internals, "price")
    .mockResolvedValue({ key: f.priceKey, rates: [] });
  jest.spyOn(internals, "spendingApproval").mockResolvedValue(undefined);
  const assertRatePrompt = jest
    .spyOn(internals, "assertRatePrompt")
    .mockResolvedValue(undefined);
  const rate = {
    profileId: "agent",
    message: {
      ...f.message,
      description: "Подтвердите тариф. Расскажите о задаче.",
    },
  };
  const status = {
    profileId: "agent",
    message: {
      id: randomUUID(),
      description: "Статус заказа",
      interaction: {},
      metadata: withSocialMessageSystemMetadata({ source: "order-status" }),
    },
  };
  const messagePage = jest
    .spyOn(internals, "messagePage")
    .mockResolvedValue({ entries: [rate, status], hasNextPage: false });
  const classify = (
    text: string,
    telegramReplyToMessageId?: string,
    checkoutState?: IOrderPaymentConversation,
    hasAttachments?: boolean,
  ) =>
    internals.chatDecision({
      task: {
        id: f.taskId,
        customerId: f.customerId,
        storeId: f.storeId,
        status: "active",
        assigneeKind: "ai",
        assigneeId: "agent",
        assignmentRevision: 2,
      },
      channel: f.channel,
      funding: { payer: "customer" },
      text,
      telegramReplyToMessageId,
      checkoutState,
      mayDispatchCheckout: true,
      hasAttachments,
    });
  return {
    ...f,
    classify,
    messagePage,
    rate,
    status,
    assertRatePrompt,
    internals,
  };
}

it.each([
  "Подтверждаю",
  "С тарифом ознакомился, условия меня устраивают, подтверждаю",
])(
  "binds a model-recognized approval to the stored rate through an intervening status notice (%s)",
  async (text) => {
    const f = chatDecisionFixture();
    f.decideCustomerWorkAction.mockResolvedValue({
      actionId: "approve-budget",
      evidence: text,
    });
    await expect(f.classify(text)).resolves.toMatchObject({
      operation: "approve-budget",
      messageId: f.message.id,
      priceKey: f.priceKey,
    });
    expect(f.decideCustomerWorkAction).toHaveBeenCalledWith({
      prompt: f.rate.message.description,
      reply: text,
      actions: [
        {
          id: "approve-budget",
          instruction: expect.stringContaining("Подтвердить тариф"),
        },
      ],
    });
  },
);

it("does not infer authorization from a question, invented evidence, or a reply to an older Telegram message", async () => {
  const f = chatDecisionFixture();
  f.decideCustomerWorkAction.mockResolvedValue({
    actionId: "approve-budget",
    evidence: "Подтверждаю",
  });
  await expect(f.classify("А как подтвердить тариф?")).resolves.toBeUndefined();
  await expect(f.classify("Подтверждаю", "9012")).resolves.toBeUndefined();
  expect(f.decideCustomerWorkAction).not.toHaveBeenCalled();
  await expect(f.classify("Я ещё думаю")).resolves.toBeUndefined();
  expect(f.decideCustomerWorkAction).toHaveBeenCalledTimes(1);
});

function checkoutReply(
  step: IOrderPaymentConversation["step"],
  buttons: { text: string; callback_data: string }[],
) {
  const f = chatDecisionFixture();
  const promptId = randomUUID();
  const prompt = {
    id: promptId,
    variant: "customer-work",
    description: "Выберите действие для оплаты заказа.",
    workReplyKey: `order-checkout:${promptId}`,
    interaction: { inline_keyboard: buttons.map((button) => [button]) },
  };
  f.messagePage.mockResolvedValue({
    entries: [{ profileId: "agent", message: prompt }],
    hasNextPage: false,
  });
  const state = { step, promptId, fileId: randomUUID() };
  return {
    ...f,
    prompt,
    answer: (text: string) => f.classify(text, undefined, state),
  };
}

it("selects a named method from the saved checkout prompt", async () => {
  const f = checkoutReply("method", [
    { text: "Stripe", callback_data: "method:stripe" },
    { text: "PayKeeper", callback_data: "method:paykeeper" },
  ]);
  f.decideCustomerWorkAction.mockResolvedValue({
    actionId: "method:paykeeper",
    evidence: "",
  });
  await expect(f.answer("Оплачу через PayKeeper")).resolves.toEqual({
    operation: "chat-checkout",
    input: {
      kind: "button",
      messageId: f.prompt.id,
      value: "method:paykeeper",
    },
  });
});

it("routes explicit skip and leaves an ordinary order comment as text", async () => {
  const f = checkoutReply("comment", [
    { text: "Без комментария", callback_data: "skip" },
  ]);
  f.decideCustomerWorkAction
    .mockResolvedValueOnce({ actionId: "skip", evidence: "" })
    .mockResolvedValueOnce({ evidence: "" });
  await expect(f.answer("Давайте без комментария")).resolves.toMatchObject({
    input: { value: "skip" },
  });
  await expect(f.answer("Пришлите документы в PDF")).resolves.toBeUndefined();
});

it("requires the current payment button and explicit grounded consent before dispatch", async () => {
  const f = checkoutReply("ready", [
    { text: "Перейти к оплате", callback_data: "pay" },
  ]);
  f.decideCustomerWorkAction.mockResolvedValue({
    actionId: "proceed-to-payment",
    evidence: "Перейдём к оплате",
  });
  await expect(f.answer("А можно оплатить позже?")).resolves.toBeUndefined();
  await expect(f.answer("Подумаю и решу позже")).resolves.toBeUndefined();
  await expect(f.answer("Перейдём к оплате")).resolves.toMatchObject({
    input: { value: "pay" },
  });
});

it("never asks the decision model to approve a replaced tariff", async () => {
  const f = chatDecisionFixture();
  f.assertRatePrompt.mockRejectedValue(
    new Error("Conflict error. The work rate message is no longer current"),
  );
  await expect(f.classify("Подтверждаю")).resolves.toBeUndefined();
  expect(f.decideCustomerWorkAction).not.toHaveBeenCalled();
});

it("finds the current keyboard beyond a page of status and buyer messages", async () => {
  const f = chatDecisionFixture();
  const reply = "Подтверждаю";
  const buyer = {
    profileId: "buyer-profile",
    message: { description: "Краткое описание компании" },
  };
  f.messagePage
    .mockResolvedValueOnce({ entries: [f.status, buyer], hasNextPage: true })
    .mockResolvedValueOnce({ entries: [f.rate, f.status], hasNextPage: false });
  f.decideCustomerWorkAction.mockResolvedValue({
    actionId: "approve-budget",
    evidence: reply,
  });
  await expect(f.classify(reply)).resolves.toMatchObject({
    operation: "approve-budget",
    messageId: f.message.id,
  });
  expect(f.messagePage).toHaveBeenNthCalledWith(2, f.channel.threadId, {
    limit: 24,
    offset: 24,
  });
});

it("requests details in the thread with the saved review, including older review messages", async () => {
  const f = chatDecisionFixture();
  const fileId = randomUUID();
  const child = { ...f.channel, threadId: randomUUID() };
  f.channels.mockResolvedValue([f.channel, child]);
  const task = {
    id: f.taskId,
    storeId: f.storeId,
    customerId: f.customerId,
    status: "active",
    assigneeKind: "ai",
    assigneeId: "agent",
    stageId: "review",
  } as ITask;
  f.getFunnel.mockResolvedValue({
    definition: {
      stages: [{ id: "review", instruction: "Проверьте черновик" }],
    },
  });
  jest
    .spyOn(f.internals, "currentReviewFile")
    .mockResolvedValue({ previewFileId: fileId });
  jest.spyOn(f.internals, "matchesReviewPrompt").mockResolvedValue(true);
  const post = jest
    .spyOn(f.service, "postOrderNotice")
    .mockResolvedValue(randomUUID());
  const preview = {
    profileId: "agent",
    message: {
      variant: "customer-work",
      workReplyKey: "attempt:review",
      metadata: { orderResultFileId: fileId },
      interaction: orderFileReviewInteraction(fileId, true),
    },
  };
  f.messagePage
    .mockResolvedValueOnce({ entries: [], hasNextPage: false })
    .mockResolvedValueOnce({ entries: [f.status], hasNextPage: true })
    .mockResolvedValueOnce({ entries: [preview], hasNextPage: false });
  await f.service.promptForResultChanges(task, fileId);
  expect(post).toHaveBeenCalledWith(
    task,
    {
      key: orderFileRevisionPromptKey(task.id, fileId),
      source: "order-result-revision",
      text: "Что нужно исправить в этом файле? Напишите в чат.",
    },
    { ...child, profileId: "agent" },
  );
});

it("binds a concrete chat correction to the current brief and ignores a superseded version", async () => {
  const f = chatDecisionFixture();
  const fileId = randomUUID();
  const current = jest
    .spyOn(f.internals, "currentReviewFile")
    .mockResolvedValue({ previewFileId: fileId });
  jest
    .spyOn(f.internals, "matchesReviewPrompt")
    .mockImplementation(async (_task, _channel, _entry, id) => id === fileId);
  f.messagePage.mockResolvedValue({
    entries: [
      {
        profileId: "agent",
        message: {
          id: randomUUID(),
          variant: "customer-work",
          workReplyKey: "attempt:test",
          description: "Проверьте черновик.",
          metadata: { orderResultFileId: fileId },
          interaction: orderFileReviewInteraction(fileId, true),
        },
      },
    ],
    hasNextPage: false,
  });
  f.decideCustomerWorkAction.mockResolvedValue({
    actionId: "revise-result",
    evidence: "",
  });
  const text = "Добавь в бриф, что в комплекте три плавника.";
  await expect(
    f.classify(text, undefined, undefined, true),
  ).resolves.toMatchObject({
    operation: "decline",
    fileId,
  });
  expect(f.decideCustomerWorkAction).toHaveBeenCalledWith(
    expect.objectContaining({
      actions: [expect.objectContaining({ id: "revise-result" })],
    }),
  );
  await expect(
    f.classify("", undefined, undefined, true),
  ).resolves.toBeUndefined();
  current.mockResolvedValue({ previewFileId: randomUUID() });
  await expect(f.classify(text)).resolves.toBeUndefined();
  expect(f.decideCustomerWorkAction).toHaveBeenCalledTimes(1);
});

it("uses one saved Social message and buyer scope to approve the delivered Telegram rate", async () => {
  const f = fixture();
  await f.service.approveRateFromTelegram(f.input);
  expect(f.execute).toHaveBeenCalledWith(f.customerId, {
    operation: "approve-budget",
    operationKey: f.message.id,
    messageId: f.message.id,
    storeId: f.storeId,
    taskId: f.taskId,
    priceKey: f.priceKey,
  });
  expect(
    readCustomerWorkRatePrompt({ ...f.message, id: randomUUID() }),
  ).toBeUndefined();
  expect(
    Buffer.byteLength(
      f.message.interaction.inline_keyboard[0][0].callback_data,
    ),
  ).toBeLessThanOrEqual(64);
});

it("refuses copied callbacks before authorizing any work", async () => {
  const f = fixture();
  await expect(
    f.service.approveRateFromTelegram({
      ...f.input,
      telegramMessageId: "9012",
    }),
  ).rejects.toThrow("The delivered work rate is unavailable");
  f.owners.mockResolvedValueOnce([]);
  await expect(f.service.approveRateFromTelegram(f.input)).rejects.toThrow(
    "The delivered work rate is unavailable",
  );
  f.members.mockResolvedValueOnce([]);
  await expect(f.service.approveRateFromTelegram(f.input)).rejects.toThrow(
    "The delivered work rate is unavailable",
  );
  f.authenticationMe.mockResolvedValueOnce({ authenticated: false });
  await expect(f.service.approveRateFromTelegram(f.input)).rejects.toThrow(
    "The delivered work rate is unavailable",
  );
  expect(f.execute).not.toHaveBeenCalled();
});

it("describes the model, rates and actual request cap in one Telegram-sized message", () => {
  const notice = customerWorkRateNotice({
    stage: {
      id: "intake",
      name: "Уточнение задачи",
      instruction: "",
      provider: { modelId: "gpt-6.2-astra", reasoning: "medium" },
      actions: [],
    },
    initial: true,
    rates: [
      {
        capability: "text",
        provider: "openai",
        version: "published",
        model: "gpt-6.2-astra",
        maxInputTokens: 50_000,
        maxOutputTokens: 2_048,
        maxCostUsd: "0.75",
        inputUsdPerMillion: "8",
        outputUsdPerMillion: "40",
        usdPerSps: "0.0013",
        workMultiplier: "2",
      },
    ],
    currency: "SPS",
    requestMaximum: "1200",
  });
  expect(notice.text).toMatch(/чем занимается ваш бизнес/);
  expect(notice.text).toMatch(
    /GPT-6\.2 Astra · medium — вход ≈ 0,012307692, выход ≈ 0,061538462/,
  );
  expect(notice.text).toMatch(/до 1\s200 SPS/);
  expect(notice.text.length).toBeLessThan(4000);
});

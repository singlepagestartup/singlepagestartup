import { randomUUID } from "node:crypto";
import {
  customerWorkRateCallback,
  customerWorkRatePromptKey,
  readCustomerWorkRatePrompt,
} from "@sps/rbac/models/subject/sdk/model";
import { Service } from ".";
import { customerWorkRateNotice } from "./utils";

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
  const service = new Service({
    authenticationMe,
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
      crm: {
        task: { findById: async () => ({ id: taskId, customerId, storeId }) },
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
        chatsToCrmModuleTasks: { channels: async () => [{ chatId, threadId }] },
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
    customerId,
    message,
    taskId,
    priceKey,
    storeId,
    input: {
      messageId,
      telegramChatId: delivery.reciever,
      telegramMessageId: delivery.sourceSystemId,
    },
  };
}

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

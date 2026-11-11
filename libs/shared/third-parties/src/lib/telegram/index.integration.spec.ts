import { randomUUID } from "node:crypto";
import { Provider } from "@sps/providers-kv";
import { telegramDeliveryRateLimit } from ".";
import { DeliveryDeferredError, DeliveryRateLimit } from "@sps/backend-utils";
import { Service as SES } from "../aws/simple-email-service";
import { GetSendQuotaCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";

const mockPrefix = `test:notification-rate:${randomUUID()}:`;
const mockKeys = new Set<string>();
let mockStore: Provider;
jest.mock("@sps/providers-kv", () => ({
  Provider: function () {
    const Real = jest.requireActual("@sps/providers-kv").Provider;
    mockStore = new Real({ type: "redis" });
    const wrap = async (method: "eval" | "get" | "set", props: any) => {
      const prefix = mockPrefix + props.prefix;
      mockKeys.add(`${prefix}:${await mockStore.hashKey({ key: props.key })}`);
      return (mockStore[method] as any)({ ...props, prefix });
    };
    return {
      eval: (props: any) => wrap("eval", props),
      get: (props: any) => wrap("get", props),
      set: (props: any) => wrap("set", props),
    };
  },
}));

// External transports are replaced. Admission and cooldowns use real Redis.
describe("Distributed notification provider limits", () => {
  beforeAll(async () => {
    new Provider({ type: "redis" });
    const client = (mockStore.client as any).client;
    if (client.status !== "ready") {
      await new Promise<void>((resolve) => client.once("ready", resolve));
    }
  });
  afterEach(async () => {
    const client = mockStore.client as any;
    for (const key of mockKeys) {
      await client.client.del(key);
    }
    mockKeys.clear();
  });
  afterAll(async () => {
    await (mockStore.client as any).client.quit();
  });

  it("paces different bot instances together and separately paces a single chat", async () => {
    const times: number[] = [];
    const previous = jest.fn(async () => {
      times.push(Date.now());
      return { ok: true, result: { message_id: times.length } };
    });
    await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const transform = telegramDeliveryRateLimit("70000:synthetic");
        return transform(previous as any, "sendMessage", {
          chat_id: index + 1,
          text: "test",
        });
      }),
    );
    expect(times).toHaveLength(12);
    expect(times.at(-1)! - times[0]).toBeGreaterThanOrEqual(420);
    const first = telegramDeliveryRateLimit("70001:synthetic");
    const second = telegramDeliveryRateLimit("70001:another-instance");
    await first(previous as any, "sendMessage", { chat_id: 100, text: "one" });
    const start = Date.now();
    await second(previous as any, "sendMessage", { chat_id: 100, text: "two" });
    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
  });

  it("charges each album item and applies Telegram retry_after to other instances", async () => {
    const previous = jest.fn(async () => ({ ok: true, result: [] }));
    const first = telegramDeliveryRateLimit("70002:synthetic");
    await first(previous as any, "sendMediaGroup", {
      chat_id: -100,
      media: Array(3).fill({ type: "photo", media: "file" }),
    });
    const second = telegramDeliveryRateLimit("70002:synthetic");
    await expect(
      second(previous as any, "sendMessage", { chat_id: -100, text: "later" }),
    ).rejects.toBeInstanceOf(DeliveryDeferredError);
    expect(previous).toHaveBeenCalledTimes(1);
    const limited = jest.fn(async () => ({
      ok: false,
      error_code: 429,
      description: "Flood control",
      parameters: { retry_after: 10 },
    }));
    await expect(
      first(limited as any, "sendMessage", { chat_id: 500, text: "test" }),
    ).rejects.toBeInstanceOf(DeliveryDeferredError);
    await expect(
      second(previous as any, "sendMessage", { chat_id: 501, text: "test" }),
    ).rejects.toBeInstanceOf(DeliveryDeferredError);
    expect(previous).toHaveBeenCalledTimes(1);
  });

  it("does not pace callback acknowledgements or allow paid broadcast flags", async () => {
    const transform = telegramDeliveryRateLimit("70003:synthetic");
    const previous = jest.fn(async () => ({ ok: true, result: true }));
    await transform(previous as any, "answerPreCheckoutQuery", {
      pre_checkout_query_id: "test",
      ok: true,
    });
    await transform(previous as any, "sendMessage", {
      chat_id: 1,
      text: "test",
      allow_paid_broadcast: true,
    });
    expect(previous.mock.calls[1][1]).toMatchObject({
      allow_paid_broadcast: false,
    });
  });

  it("reads SES account limits once and shares the remaining quota across senders", async () => {
    const send = jest.fn(async (command) => {
      if (command instanceof GetSendQuotaCommand) {
        return { MaxSendRate: 10, Max24HourSend: 200, SentLast24Hours: 198 };
      }
      expect(command).toBeInstanceOf(SendRawEmailCommand);
      return { MessageId: randomUUID() };
    });
    const create = () =>
      Object.assign(Object.create(SES.prototype), {
        client: { send },
        blockedAttachmentsRecievers: [],
      }) as SES;
    const props = {
      to: "test@example.invalid",
      from: "sender@example.invalid",
      subject: "Test",
      html: "test",
    };
    await create().sendEmail(props);
    await create().sendEmail(props);
    await expect(create().sendEmail(props)).rejects.toBeInstanceOf(
      DeliveryDeferredError,
    );
    expect(
      send.mock.calls.filter(
        ([command]) => command instanceof GetSendQuotaCommand,
      ),
    ).toHaveLength(1);
    expect(
      send.mock.calls.filter(
        ([command]) => command instanceof SendRawEmailCommand,
      ),
    ).toHaveLength(2);
  });

  it("fails closed when the rate store is unavailable", async () => {
    const limiter = new DeliveryRateLimit({
      eval: jest.fn().mockRejectedValue(new Error("Redis down")),
    });
    await expect(
      limiter.acquire({ key: "test", intervalMs: 1000, deadline: Date.now() }),
    ).rejects.toThrow("Redis down");
  });
});

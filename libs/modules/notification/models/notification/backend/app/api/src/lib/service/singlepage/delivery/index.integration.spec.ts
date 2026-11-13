import { DeliveryRepository } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository/delivery";
import { DeliveryQueue } from "@sps/broadcast/models/channel/backend/app/api/src/lib/service/singlepage/delivery-queue";
import { randomUUID, createHash } from "node:crypto";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { CRUDService } from "@sps/shared-backend-api";
import { DeliveryDeferredError } from "@sps/backend-utils";
import { Configuration as MessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Repository as ChannelRepository } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository";
import { Configuration as ChannelConfiguration } from "@sps/broadcast/models/channel/backend/app/api/src/lib/configuration";
import { Repository } from "../../../repository";
import { Configuration } from "../../../configuration";
import { Service as NotificationService } from "..";
import { Service } from ".";

import { Provider } from "@sps/providers-kv";
import { api as templateApi } from "@sps/notification/models/template/sdk/server";
import { api as relationsApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";

const mockTelegramFetch = jest.fn();
const mockBotId = `${process.pid}90001`;
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  TELEGRAM_SERVICE_BOT_TOKEN: "12345:synthetic-test-token",
}));
jest.mock("@sps/shared-third-parties", () => {
  const actual = jest.requireActual("@sps/shared-third-parties");
  return {
    ...actual,
    TelegramBot: function () {
      return new actual.TelegramBot(`${mockBotId}:test-only`, {
        client: { fetch: (...args: unknown[]) => mockTelegramFetch(...args) },
      });
    },
  };
});

// Real PostgreSQL queue leases and checkpoints; no external sends.
describe("Notification delivery on Broadcast", () => {
  const sql = getPostgresClient();
  const redis = new Provider({ type: "redis" });
  const rateKey = `telegram:${createHash("sha256").update(mockBotId).digest("hex")}`;
  const channelId = randomUUID();
  const channelRepository = new ChannelRepository(new ChannelConfiguration());
  const queue = new DeliveryQueue(
    new DeliveryRepository(new MessageConfiguration()),
  );
  const repository = new Repository(new Configuration());
  const notifications = new NotificationService(
    repository,
    {
      channel: Object.assign(new CRUDService(channelRepository), { queue }),
    },
    { find: jest.fn(), render: jest.fn() },
  );
  const channel = {
    queue,
    find: jest.fn(async () => [{ id: channelId }]),
    create: jest.fn(),
  };
  const ids: string[] = [];
  const worker = () => new Service(notifications, { channel: channel as any });
  beforeAll(async () => {
    const client = (redis.client as any).client;
    if (client.status !== "ready") {
      await new Promise<void>((resolve) => client.once("ready", resolve));
    }
    await sql`insert into sps_bt_channel(id,slug,title,admin_title) values(${channelId},${channelId},'Test delivery','Test delivery')`;
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    for (const id of ids) {
      await repository.deleteFirstByField("id", id);
    }
    await channelRepository.deleteFirstByField("id", channelId);
    await redis.del({ prefix: "notification:rate", key: rateKey });
    await redis.del({
      prefix: "notification:rate",
      key: `${rateKey}:chat:123`,
    });
    await (redis.client as any).client.quit();
    await sql.end();
  });
  async function create() {
    const id = randomUUID();
    ids.push(id);
    await repository.createDelivery({
      id,
      reciever: "123",
      status: "new",
      data: {},
    });
    return id;
  }
  async function ready(id: string) {
    const [state] = await queue.states(channelId, [id]);
    const progress = JSON.parse(state.payload);
    progress.nextAt = 0;
    await sql`update sps_bt_message set payload=${JSON.stringify(progress)} where id in (select me_id from sps_bt_cs_to_ms_34z where cl_id=${channelId} and delivery_key=${id})`;
    await sql`update sps_nn_notification set send_after=clock_timestamp()-interval '1 second' where id=${id}`;
  }

  it("allows one competing sender and resumes after the completed Telegram part", async () => {
    const id = await create();
    let rejectSecond = true;
    const transport = jest.fn(async (_method, payload) => {
      if (payload.text === "two" && rejectSecond) {
        throw new DeliveryDeferredError(Date.now() + 60000);
      }
      return {
        ok: true,
        result: {
          message_id: payload.text === "one" ? 1 : 2,
          text: "must not be stored",
        },
      };
    });
    const attempt = jest
      .spyOn(notifications, "sendNow")
      .mockImplementation(async (_props, delivery) => {
        await delivery!.telegram(transport as any, "sendMessage", {
          chat_id: 123,
          text: "one",
        });
        await delivery!.telegram(transport as any, "sendMessage", {
          chat_id: 123,
          text: "two",
        });
        return repository.updateFirstByField("id", id, {
          status: "sent",
          sourceSystemId: "2",
        }) as any;
      });
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => worker().execute(id)),
    );
    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
    const [state] = await queue.states(channelId, [id]);
    expect(state.payload).not.toContain("must not be stored");
    expect(JSON.parse(state.payload).failures).toBe(0);
    await worker().execute(id);
    expect(attempt).toHaveBeenCalledTimes(1);
    rejectSecond = false;
    await ready(id);
    const result = await worker().execute(id);
    expect(result?.status).toBe("sent");
    expect(transport).toHaveBeenCalledTimes(3);
    await worker().execute(id);
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("runs the actual Notification provider and resumes a long message after Telegram 429", async () => {
    const id = await create();
    const template = {
      id: randomUUID(),
      variant: "telegram-default",
      title: "Test",
    } as any;
    jest
      .spyOn(relationsApi, "find")
      .mockResolvedValue([{ templateId: template.id }] as any);
    jest.spyOn(templateApi, "find").mockResolvedValue([template]);
    const rendered = JSON.stringify({
      method: "sendMessage",
      props: ["test ".repeat(1800), { parse_mode: "HTML" }],
    });
    jest.spyOn(templateApi, "render").mockResolvedValue(rendered);
    let calls = 0;
    mockTelegramFetch.mockImplementation(async () => {
      calls += 1;
      if (calls === 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error_code: 429,
            description: "Flood control",
            parameters: { retry_after: 10 },
          }),
        );
      }
      return new Response(
        JSON.stringify({ ok: true, result: { message_id: calls } }),
      );
    });
    const initial = await worker().execute(id);
    expect(initial?.status).toBe("new");
    expect(calls).toBe(2);
    await ready(id);
    await redis.del({ prefix: "notification:rate", key: rateKey });
    const resumed = await worker().execute(id);
    expect(resumed?.status).toBe("sent");
    expect(calls).toBe(4);
    expect(resumed?.sourceSystemId).toBe("4");
    const [state] = await queue.states(channelId, [id]);
    const progress = JSON.parse(state.payload);
    expect(progress.failures).toBe(0);
    expect(Object.keys(progress.parts)).toHaveLength(3);
    expect(state.payload).not.toContain("test test");
  });

  it("stops an unavailable provider after three failures across worker instances", async () => {
    const id = await create();
    const attempt = jest
      .spyOn(notifications, "sendNow")
      .mockRejectedValue(new Error("provider offline"));
    for (let index = 0; index < 3; index += 1) {
      await worker().execute(id);
      await ready(id);
    }
    await worker().execute(id);
    expect(attempt).toHaveBeenCalledTimes(3);
    const result = await repository.findFirstByField("id", id);
    expect(result?.status).toBe("error");
  });

  it("publishes and checkpoints different notifications without lock inversion", async () => {
    const batch: string[] = [];
    for (const _item of Array.from({ length: 12 })) {
      batch.push(await create());
    }
    jest
      .spyOn(notifications, "sendNow")
      .mockImplementation(async ({ id }, delivery) => {
        await delivery!.verifyContent(id);
        await delivery!.email(async () => ({ MessageId: id }));
        return repository.updateFirstByField("id", id, {
          status: "sent",
        }) as any;
      });
    const results = await Promise.allSettled(
      batch.map((id) => worker().execute(id)),
    );
    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
    for (const id of batch) {
      await worker().execute(id);
      const result = await repository.findFirstByField("id", id);
      expect(result?.status).toBe("sent");
    }
  });

  it("does not overwrite a notification after losing delivery ownership", async () => {
    const id = await create();
    jest.spyOn(notifications, "sendNow").mockImplementation(async () => {
      await sql`update sps_bt_cs_to_ms_34z set lease_until=clock_timestamp()-interval '1 second' where cl_id=${channelId} and delivery_key=${id}`;
      await repository.updateFirstByField("id", id, { status: "sent" });
      throw new Error("old worker resumed after lease expiry");
    });
    const result = await worker().execute(id);
    expect(result?.status).toBe("sent");
    const saved = await repository.findFirstByField("id", id);
    expect(saved?.status).toBe("sent");
  });

  it("refuses changed content after a confirmed part instead of mixing messages", async () => {
    const id = await create();
    let content = "first";
    const send = jest.fn(async () => ({ MessageId: "confirmed" }));
    jest
      .spyOn(notifications, "sendNow")
      .mockImplementation(async (_props, delivery) => {
        await delivery!.verifyContent(content);
        await delivery!.email(send);
        throw new DeliveryDeferredError(Date.now() + 60000);
      });
    await worker().execute(id);
    content = "changed";
    await ready(id);
    const result = await worker().execute(id);
    expect(result?.status).toBe("error");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("cleans expired inactive jobs while preserving a live lease", async () => {
    const expired = randomUUID();
    const active = randomUUID();
    for (const key of [expired, active]) {
      await queue.publish({
        channelId,
        key,
        payload: "{}",
        announce: false,
      });
    }
    await queue.reserve({
      channelId,
      concurrency: 10,
      leaseSeconds: 120,
      schedule: {
        keys: [active],
        select: (states) => [{ key: active, previous: states[0].receipt }],
      },
    });
    await sql`update sps_bt_cs_to_ms_34z set created_at=clock_timestamp()-interval '3 days' where cl_id=${channelId} and delivery_key in (${expired}, ${active})`;
    await worker().cleanup();
    expect(await queue.states(channelId, [expired])).toHaveLength(0);
    expect(await queue.states(channelId, [active])).toHaveLength(1);
    // Release this fixture so the next test can reserve its single job.
    await sql`update sps_bt_cs_to_ms_34z set finished_at=clock_timestamp(),lease_until=null where cl_id=${channelId} and delivery_key=${active}`;
  });

  it("does not let an expired lease overwrite another consumer checkpoint", async () => {
    const id = randomUUID();
    await queue.publish({
      channelId,
      key: id,
      payload: "{}",
      announce: false,
    });
    const jobs = await queue.reserve({
      channelId,
      concurrency: 1,
      leaseSeconds: 120,
      schedule: {
        keys: [id],
        select: (states) => [{ key: id, previous: states[0].receipt }],
      },
    });
    const job = jobs[0];
    expect(await queue.start(job)).toBe(true);
    expect(await queue.checkpoint(job, '{"part":1}')).toBe(true);
    await sql`update sps_bt_cs_to_ms_34z set lease_until=clock_timestamp()-interval '1 second' where me_id=${job.id}`;
    expect(await queue.checkpoint(job, '{"part":2}')).toBe(false);
    const [state] = await queue.states(channelId, [id]);
    expect(state.payload).toBe('{"part":1}');
  });
});

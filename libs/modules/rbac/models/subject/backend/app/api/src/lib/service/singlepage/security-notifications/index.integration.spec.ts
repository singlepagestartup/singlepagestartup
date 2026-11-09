import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Provider as RedisProvider } from "../../../../../../../../../../../../providers/kv/src/lib/redis";
import {
  AuthenticationAttempts,
  SecurityEvents,
  type IAtomicStore,
} from "@sps/backend-utils";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as MessageRepository } from "@sps/broadcast/models/message/backend/app/api/src/lib/repository";
import { Configuration as MessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Service as MessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage";
import { Repository as ChannelRepository } from "@sps/broadcast/models/channel/backend/app/api/src/lib/repository";
import { Configuration as ChannelConfiguration } from "@sps/broadcast/models/channel/backend/app/api/src/lib/configuration";
import { Repository as NotificationRepository } from "@sps/notification/models/notification/backend/app/api/src/lib/repository";
import { Configuration as NotificationConfiguration } from "@sps/notification/models/notification/backend/app/api/src/lib/configuration";
import { Service as NotificationService } from "@sps/notification/models/notification/backend/app/api/src/lib/service/singlepage/security-summary";
import { Middleware } from "@sps/rbac/models/subject/backend/app/middlewares/src/lib/request-password-attempts";
import { Service } from ".";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  AWS_SES_FROM_EMAIL: "sender@example.invalid",
  TELEGRAM_SERVICE_BOT_TOKEN: "test-only-never-sent",
  SECURITY_NOTIFICATIONS_ENABLED: true,
}));

// Explicit integration run only, against local PostgreSQL and Redis. All
// notification transports are replaced; no messages leave this test process.
describe("Security summaries and password limits with real storage", () => {
  const sql = getPostgresClient();
  const redis = new RedisProvider();
  const prefix = `test:security:${randomUUID()}:`;
  const redisKeys = new Set<string>();
  const channelId = randomUUID();
  const subjectId = randomUUID();
  const savedNotifications = new Set<string>();
  const channelRepository = new ChannelRepository(new ChannelConfiguration());
  const messages = new MessageService(
    new MessageRepository(new MessageConfiguration()),
  );
  const notificationRepository = new NotificationRepository(
    new NotificationConfiguration(),
  );
  const notification = new NotificationService(notificationRepository);
  const deliver = jest
    .spyOn(notification as any, "deliver")
    .mockImplementation(async (...args: any[]) => {
      if (args[0] === "telegram") {
        throw new Error("simulated blocked Telegram");
      }
      return "test-email-accepted";
    });
  const store: IAtomicStore = {
    async eval(props) {
      const key = `${prefix}${props.prefix}:${await redis.hashKey({ key: props.key })}`;
      redisKeys.add(key);
      return redis.eval({ ...props, prefix: prefix + props.prefix });
    },
  };

  beforeAll(async () => {
    if (redis.client.status !== "ready") {
      await new Promise<void>((resolve) => redis.client.once("ready", resolve));
    }
    await sql`insert into sps_bt_channel(id,slug,title,admin_title) values(${channelId},${channelId},${channelId},${channelId})`;
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    for (const id of savedNotifications) {
      await notificationRepository.deleteFirstByField("id", id);
    }
    await channelRepository.deleteFirstByField("id", channelId);
    if (redisKeys.size) {
      await redis.client.del(...redisKeys);
    }
    await redis.client.quit();
    await sql.end();
  });

  async function expireMinute(account: string) {
    const key = `${prefix}rate-limit:password-failures:${await redis.hashKey({ key: account })}`;
    const state = JSON.parse((await redis.client.get(key))!);
    state.minuteStart -= 61;
    await redis.client.set(key, JSON.stringify(state), "KEEPTTL");
  }

  it("atomically caps parallel checks at ten and retains only fifty failures per hour", async () => {
    const attempts = new AuthenticationAttempts(store, 10, 50);
    const account = randomUUID();
    for (const batch of [1, 2, 3, 4, 5]) {
      const reservations = await Promise.all(
        Array.from({ length: 40 }, () => attempts.reserve(account)),
      );
      const admitted = reservations.filter((item) => item.allowed);
      expect(admitted).toHaveLength(10);
      await Promise.all(
        admitted.map((item) => attempts.finish(account, item.receipt, true)),
      );
      await expireMinute(account);
    }
    const denied = await attempts.reserve(account);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterInSeconds).toBeGreaterThan(3000);
    const key = `${prefix}rate-limit:password-failures:${await redis.hashKey({ key: account })}`;
    const ttl = await redis.client.ttl(key);
    await attempts.reserve(account);
    expect(await redis.client.ttl(key)).toBeLessThanOrEqual(ttl);
  });

  it("releases successful and failed-server checks, and ignores duplicate completion", async () => {
    const attempts = new AuthenticationAttempts(store, 10, 50);
    const account = randomUUID();
    for (const item of Array.from({ length: 60 })) {
      const reservation = await attempts.reserve(account);
      expect(reservation.allowed).toBe(true);
      await attempts.finish(account, reservation.receipt, false);
      await attempts.finish(account, reservation.receipt, false);
    }
    const failure = await attempts.reserve(account);
    await attempts.finish(account, failure.receipt, true);
    const success = await attempts.reserve(account);
    const result = await attempts.finish(account, success.receipt, false);
    expect(result.previousFailures).toBe(1);
  });

  it("returns actual HTTP 401 then 429 through Hono with a shared account budget", async () => {
    const app = new Hono();
    app.onError((error, c) => {
      if (error instanceof HTTPException) {
        return c.json({ error: error.message }, error.status);
      }
      return c.json({ error: "internal" }, 500);
    });
    app.post(
      "/",
      new Middleware({
        storeProvider: store,
        enabled: true,
        minuteLimit: 2,
        hourLimit: 3,
      }).init(),
      () => {
        throw new HTTPException(401);
      },
    );
    const login = `${randomUUID()}@example.invalid`;
    const statuses: number[] = [];
    for (const address of ["192.0.2.1", "192.0.2.2", "192.0.2.3"]) {
      const body = new FormData();
      body.set("data", JSON.stringify({ login, password: "wrong" }));
      const response = await app.request("/", {
        method: "POST",
        body,
        headers: { "X-Forwarded-For": address },
      });
      statuses.push(response.status);
    }
    expect(statuses).toEqual([401, 401, 429]);
  });

  it("aggregates counts and bounds categories without storing credentials", async () => {
    const events = new SecurityEvents(store);
    await Promise.all(
      Array.from({ length: 100 }, () => events.record("password-failed")),
    );
    const time = Number((await redis.client.time())[0]);
    const summary = await events.read(
      Math.floor(time / events.window) * events.window,
    );
    expect(summary?.counts["password-failed"]).toBeGreaterThanOrEqual(100);
    expect(Object.keys(summary!)).toEqual(
      expect.arrayContaining(["start", "end", "counts"]),
    );
    expect(JSON.stringify(summary)).not.toContain("password:");
  });

  it("coalesces concurrent workers into one private message and deduplicates fallback delivery", async () => {
    const events = new SecurityEvents(store);
    const start =
      Math.floor(Date.now() / 1000 / events.window) * events.window -
      events.window;
    const summary = {
      start,
      end: start + events.window,
      counts: { "password-failed": 21 },
    };
    jest.spyOn(SecurityEvents.prototype, "read").mockResolvedValue(summary);
    const role = { find: jest.fn(async () => [{ id: "admin" }]) };
    const assignments = { find: jest.fn(async () => [{ subjectId }]) };
    const identities = {
      find: jest.fn(async () => [
        {
          provider: "telegram",
          account: "12345",
          email: "admin@example.invalid",
        },
      ]),
    };
    const links = { find: jest.fn(async () => [{ identityId: "identity" }]) };
    const sendSecuritySummary = jest.fn(async (props) => {
      const result = await notification.execute(props);
      savedNotifications.add(result.id);
      return result;
    });
    const createWorker = () =>
      new Service(
        role as any,
        assignments as any,
        links as any,
        identities as any,
        { notification: { sendSecuritySummary } } as any,
        {
          channel: { find: async () => [{ id: channelId }] },
          message: messages,
        } as any,
      );
    await Promise.all(
      Array.from({ length: 8 }, () => createWorker().execute()),
    );
    // try-lock losers may exit, but the winner completes before Promise.all.
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(deliver.mock.calls.map((call) => call[0])).toEqual([
      "telegram",
      "email",
    ]);
    await createWorker().execute();
    expect(deliver).toHaveBeenCalledTimes(2);
    const [state] = await messages.queue.states(channelId, [
      "security-summary",
    ]);
    expect(JSON.parse(state.payload).complete).toBe(true);
    const rows =
      await sql`select me_id from sps_bt_cs_to_ms_34z where cl_id=${channelId}`;
    expect(rows).toHaveLength(1);
    expect(await messages.findById({ id: rows[0].me_id })).toBeFalsy();
    for (const id of savedNotifications) {
      const saved = await notification.findById({ id });
      expect(saved?.status).toBe("sent");
      expect(saved?.variant).toBe("security-summary-email");
      expect(saved?.data?.attempts).toBe(2);
    }
    // Even if a later attempt starts with Telegram, successful fallback is final.
    await sendSecuritySummary({
      incidentId: `security:${start}`,
      subjectId,
      method: "telegram",
      receiver: "12345",
      summary,
    });
    expect(deliver).toHaveBeenCalledTimes(2);

    // In the next period both providers fail. Retries remain bounded even
    // across fresh service instances; the next period reuses the same message.
    const nextTime = Date.now() + events.window * 1000;
    const clock = jest.spyOn(Date, "now").mockReturnValue(nextTime);
    summary.start += events.window;
    summary.end += events.window;
    deliver.mockRejectedValue(new Error("both transports unavailable"));
    const notificationCallsBefore = deliver.mock.calls.length;
    for (const retry of [1, 2, 3, 4, 5]) {
      await sql`update sps_bt_message set payload=jsonb_set(payload::jsonb, '{nextAt}', '0')::text where id=${rows[0].me_id}`;
      await createWorker().execute();
    }
    expect(deliver.mock.calls.length - notificationCallsBefore).toBe(3);
    const [failed] = await messages.queue.states(channelId, [
      "security-summary",
    ]);
    expect(JSON.parse(failed.payload).attempts).toBe(3);
    expect(JSON.parse(failed.payload).complete).toBe(false);
    expect(
      await sql`select me_id from sps_bt_cs_to_ms_34z where cl_id=${channelId}`,
    ).toHaveLength(1);

    // Removing the administrator role prevents a queued summary from finding
    // that recipient on its next eligible run.
    clock.mockReturnValue(nextTime + events.window * 1000);
    summary.start += events.window;
    summary.end += events.window;
    assignments.find.mockResolvedValue([]);
    await createWorker().execute();
    expect(deliver.mock.calls.length - notificationCallsBefore).toBe(3);
    const [newest] = await messages.queue.states(channelId, [
      "security-summary",
    ]);
    clock.mockReturnValue(nextTime);
    await createWorker().execute();
    const [afterDelayedWorker] = await messages.queue.states(channelId, [
      "security-summary",
    ]);
    expect(afterDelayedWorker.payload).toBe(newest.payload);
    clock.mockRestore();
  });
});

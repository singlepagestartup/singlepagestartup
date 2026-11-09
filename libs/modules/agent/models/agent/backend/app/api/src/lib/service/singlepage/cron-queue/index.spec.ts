import { AgentRun } from "../agent-run";
import { CronQueue } from "./index";
import {
  DeliveryQueue,
  type IDeliveryState,
} from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage/delivery-queue";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  AGENT_MAX_DURATION_IN_SECONDS: 60,
  AGENT_CRON_MAX_CONCURRENCY: 1,
  RBAC_SECRET_KEY: "test",
}));

function fixture(agentIds = ["second", "first"]) {
  let now = new Date("2026-11-05T12:00:00Z");
  const states = new Map<string, IDeliveryState>();
  const repository = {
    find: async () =>
      agentIds.map((id) => ({
        id,
        slug: id,
        interval: "* * * * *",
      })),
  };
  const queue = new DeliveryQueue({
    deliveryStates: async () => [...states.values()],
    withDeliveryQueue: async (
      _channel: string,
      work: (now: Date) => Promise<unknown>,
    ) => work(now),
    activeDeliveryCount: async () =>
      [...states.values()].filter(
        (s) => s.leaseUntil && s.leaseUntil > now && !s.finishedAt,
      ).length,
    publishDelivery: async ({ key, previous }: any) =>
      states.set(key, {
        payload: "{}",
        key,
        receipt: null,
        startedAt: null,
        finishedAt: null,
        leaseUntil: null,
        claimedAt: null,
        ...previous,
      }),
    reserveDelivery: async (
      { key, receipt }: any,
      _previous: string | null,
      claimedAt: Date,
      leaseUntil: Date,
    ) => {
      states.set(key, {
        payload: "{}",
        key,
        receipt,
        claimedAt,
        leaseUntil,
        startedAt: null,
        finishedAt: null,
      });
      return { id: key, payload: "{}" };
    },
  } as any);
  const runs = new AgentRun({ broadcastModule: { message: { queue } } as any });
  jest.spyOn(runs, "findChannel").mockResolvedValue({ id: "channel" });
  const markers = jest.spyOn(runs, "findMarkers").mockResolvedValue([]);
  const dispatch = jest
    .spyOn(runs, "dispatch")
    .mockImplementation(async ({ agent, runId }) => ({
      slug: agent.slug,
      runId,
      status: "left-running",
    }));
  return {
    queue: new CronQueue(repository as any, runs),
    states,
    dispatch,
    markers,
    setTime: (time: string) => {
      now = new Date(time);
    },
  };
}

it("fills a freed slot in the same tick and defers agents due in the next minute", async () => {
  const { queue, states, dispatch, setTime } = fixture([
    "first",
    "second",
    "later",
  ]);
  const tickStart = new Date("2026-11-05T12:00:00Z");
  states.set("later", {
    payload: "{}",
    key: "later",
    receipt: "already-finished",
    claimedAt: tickStart,
    startedAt: tickStart,
    leaseUntil: null,
    finishedAt: tickStart,
  });

  const dispatched: string[] = [];
  dispatch.mockImplementation(async ({ agent, runId }) => {
    dispatched.push(agent.slug);
    const run = states.get(agent.id)!;
    run.finishedAt = new Date("2026-11-05T12:01:10Z");
    setTime("2026-11-05T12:01:10Z");
    return { slug: agent.slug, runId, status: "finished" };
  });

  await queue.tick();
  expect(dispatched).toEqual(["first", "second"]);

  await queue.tick();
  expect(dispatched).toEqual(["first", "second", "later"]);
});

it("counts a handed-off run across ticks, then takes the oldest waiting job first", async () => {
  const f = fixture();
  await f.queue.tick();
  expect(f.dispatch.mock.calls.map(([c]) => c.agent.slug)).toEqual(["first"]);
  f.setTime("2026-11-05T12:02:00Z");
  const first = f.states.get("first")!;
  first.leaseUntil = new Date("2026-11-05T12:02:50Z");
  await f.queue.tick();
  expect(f.dispatch).toHaveBeenCalledTimes(1);
  first.finishedAt = new Date("2026-11-05T12:02:00Z");
  await f.queue.tick();
  expect(f.dispatch.mock.calls.map(([c]) => c.agent.slug)).toEqual([
    "first",
    "second",
  ]);
});

it("keeps an existing finished schedule after the old Broadcast messages expire", async () => {
  const f = fixture();
  const old = {
    id: "m",
    slug: "first",
    runId: "prior",
    datetime: new Date("2026-11-05T12:00:00Z"),
    result: { ok: true },
  };
  f.markers.mockResolvedValue([old]);
  await f.queue.tick();
  expect(f.dispatch.mock.calls[0][0].agent.slug).toBe("second");
  f.states.get("second")!.finishedAt = old.datetime;
  f.markers.mockResolvedValue([]);
  f.setTime("2026-11-05T12:00:55Z");
  await f.queue.tick();
  expect(f.dispatch).toHaveBeenCalledTimes(1);
  expect(f.states.get("first")!.receipt).toBe("prior");
});

it("recovers an abandoned claim and fences the old run id", async () => {
  const f = fixture();
  const stale = new Date("2026-11-05T11:50:00Z");
  f.states.set("first", {
    payload: "{}",
    key: "first",
    receipt: "lost",
    claimedAt: stale,
    startedAt: null,
    leaseUntil: stale,
    finishedAt: null,
  });
  const fresh = new Date("2026-11-05T12:00:00Z");
  f.states.set("second", {
    payload: "{}",
    key: "second",
    receipt: "done",
    claimedAt: fresh,
    startedAt: fresh,
    leaseUntil: null,
    finishedAt: fresh,
  });
  await f.queue.tick();
  expect(f.dispatch).toHaveBeenCalledTimes(1);
  expect(f.dispatch.mock.calls[0][0].agent.slug).toBe("first");
  expect(f.states.get("first")!.receipt).not.toBe("lost");
});

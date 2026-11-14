const mockAcknowledge = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS: 1,
  AGENT_MAX_DURATION_IN_SECONDS: 600,
  API_SERVICE_URL: "http://localhost:4000",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/agent/models/agent/sdk/model", () => ({
  route: "/api/agent/agents",
  runIdHeader: "X-SPS-AGENT-RUN-ID",
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}));

import { AgentRun } from "./index";

const originalFetch = globalThis.fetch;

interface IStoredMarker {
  id: string;
  slug: string;
  datetime: string;
  runId?: string;
  result?: Record<string, unknown>;
}

function createBroadcastModule(markers: IStoredMarker[]) {
  return {
    channel: {
      find: jest.fn().mockResolvedValue([{ id: "cron-channel-id" }]),
      transientChannelMessages: jest.fn().mockResolvedValue(
        markers.map((marker) => ({
          id: marker.id,
          payload: JSON.stringify(marker),
        })),
      ),
      findById: jest.fn(),
    },
  } as any;
}

function createAgentRun(markers: IStoredMarker[] = []) {
  const broadcastModule = createBroadcastModule(markers);
  mockAcknowledge.mockImplementation(async (owner: { receipt: string }) =>
    markers.some((marker) => marker.runId === owner.receipt && !marker.result),
  );
  broadcastModule.channel.queue = { acknowledge: mockAcknowledge };
  return new AgentRun({ broadcastModule });
}

describe("Given: an agent whose executions are tracked on the cron channel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("refuses an invalid schedule before the first run", () => {
    expect(
      createAgentRun().isDue({
        agent: { slug: "dummy", interval: "not a cron expression" } as any,
        now: new Date("2026-11-02T12:00:00.000Z"),
      }),
    ).toEqual({ due: false, reason: "invalid-interval" });
  });

  /**
   * BDD Scenario: a live run blocks the next dispatch.
   *
   * Given: a running marker younger than the maximum run duration.
   * When: the runner evaluates the agent.
   * Then: the agent is not due and the reason names the live run.
   */
  it("Then: reports an agent with a fresh running marker as not due", () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const decision = createAgentRun().isDue({
      agent: { slug: "host-module-page-cache", interval: "* * * * *" } as any,
      marker: {
        datetime: new Date("2026-09-19T11:55:00.000Z"),
        runId: "run-1",
      },
      now,
    });

    expect(decision).toEqual({ due: false, reason: "running" });
  });

  /**
   * BDD Scenario: a lost run is superseded.
   *
   * Given: a running marker older than the maximum run duration.
   * When: the runner evaluates the agent.
   * Then: the agent is due and the decision carries the superseded run id.
   */
  it("Then: reports an agent with a stale running marker as due and superseding it", () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const decision = createAgentRun().isDue({
      agent: { slug: "host-module-page-cache", interval: "* * * * *" } as any,
      marker: {
        datetime: new Date("2026-09-19T11:40:00.000Z"),
        runId: "run-1",
      },
      now,
    });

    expect(decision).toEqual({
      due: true,
      reason: "stale-run",
      supersedes: "run-1",
    });
  });

  /**
   * BDD Scenario: a finished run hands the decision back to the schedule.
   *
   * Given: a finished marker and an hourly interval.
   * When: the runner evaluates the agent before and after the next occurrence.
   * Then: only the evaluation after the occurrence is due.
   */
  it("Then: applies the interval once the last run is finished", () => {
    const agentRun = createAgentRun();
    const marker = {
      id: "marker-1",
      slug: "host-module-page-cache",
      datetime: new Date("2026-09-19T11:00:00.000Z"),
      runId: "run-1",
      result: { ok: true },
    };
    const agent = {
      slug: "host-module-page-cache",
      interval: "0 * * * *",
    } as any;

    expect(
      agentRun.isDue({
        agent,
        marker,
        now: new Date("2026-09-19T11:30:00.000Z"),
      }),
    ).toEqual({ due: false, reason: "not-scheduled" });
    expect(
      agentRun.isDue({
        agent,
        marker,
        now: new Date("2026-09-19T12:00:00.000Z"),
      }),
    ).toEqual({ due: true, reason: "scheduled" });
  });

  /**
   * BDD Scenario: a superseded run cannot report a result.
   *
   * Given: the newest marker of the slug belongs to a later run.
   * When: the older run tries to record its outcome.
   * Then: nothing is written and the caller is told the result was dropped.
   */
  it("Then: refuses to record the result of a run that no longer owns the slug", async () => {
    const agentRun = createAgentRun([
      {
        id: "marker-2",
        slug: "host-module-page-cache",
        datetime: "2026-09-19T12:00:00.000Z",
        runId: "run-2",
      },
    ]);

    const recorded = await agentRun.markFinished({
      slug: "host-module-page-cache",
      runId: "run-1",
      result: { ok: true },
    });

    expect(recorded).toBe(false);
    expect(mockAcknowledge).toHaveBeenCalledWith(
      {
        channelId: "cron-channel-id",
        key: "host-module-page-cache",
        receipt: "run-1",
      },
      expect.any(String),
      undefined,
    );
  });

  /**
   * BDD Scenario: a slow handler keeps running after the dispatch window.
   *
   * Given: a handler that never sends a response before the dispatch aborts.
   * When: the runner dispatches the agent.
   * Then: the dispatch returns without a result marker and carries the run id
   * header, so the handler can close its own run.
   */
  it("Then: leaves a slow handler running without recording a result", async () => {
    const agentRun = createAgentRun();
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    const fetchAgent = jest.fn().mockRejectedValue(abortError);
    globalThis.fetch = fetchAgent as any;

    const dispatch = await agentRun.dispatch({
      agent: { slug: "host-module-page-cache" } as any,
      runId: "run-1",
    });

    expect(fetchAgent).toHaveBeenCalledWith(
      "http://localhost:4000/api/agent/agents/host-module-page-cache",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
          "X-SPS-AGENT-RUN-ID": "run-1",
        }),
      }),
    );
    expect(dispatch).toEqual({
      slug: "host-module-page-cache",
      runId: "run-1",
      status: "left-running",
    });
    expect(mockAcknowledge).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the dispatch never waits for the handler's body.
   *
   * Given: a response whose body never resolves.
   * When: the runner dispatches the agent.
   * Then: the dispatch returns and the body is left untouched.
   */
  it("Then: returns without reading the response body", async () => {
    const agentRun = createAgentRun();
    const json = jest.fn(() => new Promise(() => undefined));
    const text = jest.fn(() => new Promise(() => undefined));
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json,
      text,
    }) as any;

    const dispatch = await agentRun.dispatch({
      agent: { slug: "dummy" } as any,
      runId: "run-1",
    });

    expect(dispatch.status).toBe("finished");
    expect(json).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a refused dispatch is a finished run.
   *
   * Given: the self request fails before the handler was reached.
   * When: the runner dispatches the agent.
   * Then: the failure is recorded as the run's result.
   */
  it("Then: records a failed dispatch as the result of the run", async () => {
    const agentRun = createAgentRun([
      {
        id: "marker-1",
        slug: "dummy",
        datetime: "2026-09-19T12:00:00.000Z",
        runId: "run-1",
      },
    ]);
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Unable to connect")) as any;

    const dispatch = await agentRun.dispatch({
      agent: { slug: "dummy" } as any,
      runId: "run-1",
    });

    expect(dispatch).toEqual({
      slug: "dummy",
      runId: "run-1",
      status: "failed",
      error: "Unable to connect",
    });
    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockAcknowledge.mock.calls[0][1]).result).toEqual({
      error: "Unable to connect",
    });
  });
});

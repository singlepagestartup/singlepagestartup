/**
 * BDD Suite: the cron runner starts agent runs instead of waiting for them.
 *
 * Given: agents whose markers say which of them are due.
 * When: the cron route runs.
 * Then: it dispatches only the due agents, keeps the dispatches bounded, and
 * answers without waiting for a long handler.
 */

const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  AGENT_CRON_MAX_CONCURRENCY: 3,
  RBAC_SECRET_KEY: "test-rbac-secret",
  limitedParallelExecution:
    jest.requireActual("@sps/shared-utils").limitedParallelExecution,
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    details: error,
    message: error.message,
    status: 500,
  }),
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: jest.fn(),
  },
}));

import { Handler } from "./cron";

interface IDeferred {
  promise: Promise<void>;
  resolve: () => void;
}

function createDeferred(): IDeferred {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props: {
  agents: { slug: string; interval?: string }[];
  isDue: jest.Mock;
  dispatch: jest.Mock;
}) {
  return {
    find: jest.fn().mockResolvedValue(props.agents),
    agentRun: {
      findChannel: jest.fn().mockResolvedValue({ id: "cron-channel-id" }),
      findMarkers: jest.fn().mockResolvedValue([]),
      isDue: props.isDue,
      dispatch: props.dispatch,
    },
  } as any;
}

describe("Given: a cron tick over the configured agents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: only due agents are dispatched.
   *
   * Given: one due agent and one agent whose run is still active.
   * When: the cron route runs.
   * Then: only the due agent is dispatched and reported.
   */
  it("Then: dispatches and reports only the agents the markers allow", async () => {
    const dispatch = jest.fn().mockResolvedValue({
      slug: "dummy",
      runId: "run-1",
      status: "left-running",
    });
    const isDue = jest.fn((props: any) =>
      props.agent.slug === "dummy"
        ? { due: true, reason: "scheduled" }
        : { due: false, reason: "running" },
    );
    const service = createService({
      agents: [
        { slug: "dummy", interval: "* * * * *" },
        { slug: "host-module-page-cache", interval: "* * * * *" },
      ],
      isDue,
      dispatch,
    });

    const result = await new Handler(service).execute(
      createContext(),
      jest.fn(),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      agent: { slug: "dummy", interval: "* * * * *" },
      supersedes: undefined,
      channel: { id: "cron-channel-id" },
      previousMarkers: [],
    });
    expect(result).toEqual({
      data: [{ slug: "dummy", interval: "* * * * *" }],
    });
  });

  /**
   * BDD Scenario: dispatches are bounded.
   *
   * Given: four due agents and a concurrency bound of three.
   * When: the cron route runs.
   * Then: the fourth dispatch starts only after one of the first three settles.
   */
  it("Then: starts a further dispatch only after a running one settles", async () => {
    const started: string[] = [];
    const deferreds: Record<string, IDeferred> = {
      "agent-1": createDeferred(),
      "agent-2": createDeferred(),
      "agent-3": createDeferred(),
      "agent-4": createDeferred(),
    };
    const dispatch = jest.fn(async (props: any) => {
      started.push(props.agent.slug);

      await deferreds[props.agent.slug].promise;

      return { slug: props.agent.slug, runId: "run", status: "finished" };
    });
    const service = createService({
      agents: [
        { slug: "agent-1" },
        { slug: "agent-2" },
        { slug: "agent-3" },
        { slug: "agent-4" },
      ],
      isDue: jest.fn(() => ({ due: true, reason: "scheduled" })),
      dispatch,
    });

    const execution = new Handler(service).execute(createContext(), jest.fn());

    await flush();

    expect(started).toEqual(["agent-1", "agent-2", "agent-3"]);

    deferreds["agent-1"].resolve();
    await flush();

    expect(started).toEqual(["agent-1", "agent-2", "agent-3", "agent-4"]);

    deferreds["agent-2"].resolve();
    deferreds["agent-3"].resolve();
    deferreds["agent-4"].resolve();

    await execution;
  });

  /**
   * BDD Scenario: a failing dispatch does not stop the tick.
   *
   * Given: one agent whose dispatch throws.
   * When: the cron route runs.
   * Then: the error is logged and the remaining agents are still dispatched.
   */
  it("Then: logs a dispatch error and keeps dispatching the other agents", async () => {
    const dispatch = jest.fn(async (props: any) => {
      if (props.agent.slug === "agent-1") {
        throw new Error("Validation error. Invalid cron channel configuration");
      }

      return { slug: props.agent.slug, runId: "run", status: "finished" };
    });
    const service = createService({
      agents: [{ slug: "agent-1" }, { slug: "agent-2" }],
      isDue: jest.fn(() => ({ due: true, reason: "scheduled" })),
      dispatch,
    });

    const result = await new Handler(service).execute(
      createContext(),
      jest.fn(),
    );

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "❌ An error during agent 'agent-1':",
      expect.any(Error),
    );
    expect(result).toEqual({
      data: [{ slug: "agent-1" }, { slug: "agent-2" }],
    });
  });
});

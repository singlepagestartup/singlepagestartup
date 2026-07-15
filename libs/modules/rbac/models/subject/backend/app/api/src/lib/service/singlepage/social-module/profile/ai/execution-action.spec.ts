/**
 * BDD Suite: durable AI execution action projection.
 *
 * Given: a social.profile tool loop emits safe tool lifecycle events.
 * When: the reporter projects them into Social actions.
 * Then: one related action is updated in place and persistence failure cannot interrupt work.
 */

import { AiExecutionActionReporter } from "./execution-action";
import type { TSocialProfileAiToolLoopEvent } from "./tool-loop";

function createPersistence() {
  return {
    createAction: jest.fn(async () => ({ id: "action-1" })),
    updateAction: jest.fn(async () => ({ id: "action-1" })),
    linkChat: jest.fn(async () => ({})),
    linkThread: jest.fn(async () => ({})),
    linkProfile: jest.fn(async () => ({})),
  };
}

function createReporter(persistence = createPersistence()) {
  const timestamps = [
    "2026-07-13T12:00:00.000Z",
    "2026-07-13T12:00:01.000Z",
    "2026-07-13T12:00:02.000Z",
    "2026-07-13T12:00:03.000Z",
    "2026-07-13T12:00:04.000Z",
  ];
  let index = 0;

  return {
    persistence,
    reporter: new AiExecutionActionReporter({
      chatId: "chat-1",
      threadId: "thread-1",
      triggerMessageId: "message-1",
      replySocialProfileId: "profile-1",
      secretKey: "secret",
      runId: "run-1",
      now: () => new Date(timestamps[index++] || timestamps.at(-1)!),
      persistence,
    }),
  };
}

function toolEvent(
  type: "tool_requested" | "tool_started" | "tool_succeeded",
): TSocialProfileAiToolLoopEvent {
  return {
    type,
    callId: "call-1",
    name: "mcp__singlepagestartup__model_record_count",
    source: "mcp",
    label: "Count model records",
    serverId: "singlepagestartup",
    selectedModelId: "openai/gpt-5.5",
    ...(type === "tool_succeeded" ? { resultBytes: 42 } : {}),
  } as TSocialProfileAiToolLoopEvent;
}

describe("Given: safe social.profile tool lifecycle events", () => {
  /**
   * BDD Scenario
   * Given: no tool is requested during the run.
   * When: only the terminal event is reported.
   * Then: no Social action is created.
   */
  it("When: no tool runs Then: it creates no action", async () => {
    const { reporter, persistence } = createReporter();

    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 100,
    });

    expect(persistence.createAction).not.toHaveBeenCalled();
    expect(persistence.updateAction).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: one MCP call advances through its lifecycle.
   * When: the reporter receives every event.
   * Then: it creates one action, awaits all relations, and updates that stable id.
   */
  it("When: one tool completes Then: one related action is updated in place", async () => {
    const { reporter, persistence } = createReporter();

    await reporter.handle(toolEvent("tool_requested"));
    await reporter.handle(toolEvent("tool_started"));
    await reporter.handle(toolEvent("tool_succeeded"));
    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 3000,
    });

    expect(persistence.createAction).toHaveBeenCalledTimes(1);
    expect(persistence.linkChat).toHaveBeenCalledWith("action-1", "chat-1");
    expect(persistence.linkThread).toHaveBeenCalledWith("action-1", "thread-1");
    expect(persistence.linkProfile).toHaveBeenCalledWith(
      "action-1",
      "profile-1",
    );
    expect(persistence.updateAction).toHaveBeenCalledTimes(3);
    expect(persistence.updateAction).toHaveBeenLastCalledWith(
      "action-1",
      expect.objectContaining({
        runId: "run-1",
        status: "completed",
        phase: "finalizing",
        steps: [
          expect.objectContaining({
            id: "call-1",
            status: "succeeded",
            resultBytes: 42,
          }),
        ],
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: the action service rejects a create request.
   * When: progress is reported.
   * Then: the reporter resolves best-effort instead of rejecting the social.profile tool loop.
   */
  it("When: persistence fails Then: progress remains non-blocking", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const persistence = createPersistence();
    persistence.createAction.mockRejectedValueOnce(
      new Error("action service unavailable"),
    );
    const { reporter } = createReporter(persistence);

    await expect(
      reporter.handle(toolEvent("tool_requested")),
    ).resolves.toBeUndefined();
    await reporter.handle(toolEvent("tool_started"));

    expect(persistence.createAction).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

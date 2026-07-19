/**
 * BDD Suite: safe AI execution action payload.
 *
 * Given: RBAC projects a social.profile tool run into a generic Social action.
 * When: consumers parse the versioned ai-execution payload.
 * Then: only bounded presentation-safe fields are accepted and malformed data fails closed.
 */

import {
  AI_EXECUTION_ACTION_MAX_STEPS,
  AI_EXECUTION_ACTION_VARIANT,
  formatAiExecutionActionStepToolName,
  parseAiExecutionActionPayload,
} from "./ai-execution-action";

const now = "2026-07-13T12:00:00.000Z";

function createAction() {
  return {
    variant: AI_EXECUTION_ACTION_VARIANT,
    payload: {
      version: 1,
      runId: "run-1",
      triggerMessageId: "message-1",
      replySocialProfileId: "profile-1",
      status: "running",
      phase: "tool_running",
      selectedModelId: "openai/gpt-5.5",
      startedAt: now,
      steps: [
        {
          id: "call-1",
          kind: "mcp",
          serverId: "singlepagestartup",
          toolName: "model-record-count",
          label: "Count model records",
          status: "running",
          startedAt: now,
        },
      ],
    },
  };
}

describe("Given: a versioned ai-execution Social action", () => {
  /**
   * BDD Scenario
   * Given: an MCP step contains the collision-safe model function namespace.
   * When: its tool name is prepared for user-visible progress.
   * Then: the redundant namespace and Markdown-sensitive underscores are removed.
   */
  it.each([
    ["mcp__singlepagestartup__module-list", "module-list"],
    ["mcp__singlepagestartup__model_record_count", "model-record-count"],
    ["module-list", "module-list"],
  ])(
    "When: MCP name %s is displayed Then: it becomes %s",
    (toolName, expected) => {
      expect(
        formatAiExecutionActionStepToolName({
          kind: "mcp",
          serverId: "singlepagestartup",
          toolName,
        }),
      ).toBe(expected);
    },
  );

  /**
   * BDD Scenario
   * Given: every payload field is bounded and presentation-safe.
   * When: the payload is parsed.
   * Then: the typed projection is returned without adding raw execution data.
   */
  it("When: payload is valid Then: it returns the typed safe projection", () => {
    expect(parseAiExecutionActionPayload(createAction())).toMatchObject({
      runId: "run-1",
      status: "running",
      steps: [
        {
          id: "call-1",
          kind: "mcp",
          serverId: "singlepagestartup",
          toolName: "model-record-count",
          status: "running",
        },
      ],
    });
  });

  /**
   * BDD Scenario
   * Given: an unsupported variant, malformed timestamp, or oversized step list.
   * When: the payload is parsed.
   * Then: parsing fails closed instead of exposing the raw JSON.
   */
  it.each([
    { variant: "default", payload: createAction().payload },
    {
      ...createAction(),
      payload: { ...createAction().payload, startedAt: "not-a-date" },
    },
    {
      ...createAction(),
      payload: {
        ...createAction().payload,
        steps: Array.from(
          { length: AI_EXECUTION_ACTION_MAX_STEPS + 1 },
          () => createAction().payload.steps[0],
        ),
      },
    },
  ])("When: payload is unsupported Then: it returns null", (action) => {
    expect(parseAiExecutionActionPayload(action)).toBeNull();
  });

  /**
   * BDD Scenario
   * Given: an otherwise valid step contains an untyped raw field.
   * When: the payload is parsed.
   * Then: the returned projection contains only the explicit safe contract.
   */
  it("When: extra raw data exists Then: it is omitted from the projection", () => {
    const action = createAction();
    const payload = {
      ...action.payload,
      authorization: "Bearer secret",
      steps: [
        {
          ...action.payload.steps[0],
          arguments: { token: "secret" },
          result: { rows: ["private"] },
        },
      ],
    };
    const parsed = parseAiExecutionActionPayload({ ...action, payload });

    expect(parsed).not.toHaveProperty("authorization");
    expect(parsed?.steps[0]).not.toHaveProperty("arguments");
    expect(parsed?.steps[0]).not.toHaveProperty("result");
  });
});

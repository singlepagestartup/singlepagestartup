/**
 * BDD Suite: bounded AI employee tool loop.
 *
 * Given: OpenRouter can request profile-bound or MCP-backed tools.
 * When: the employee loop validates, executes, and replays those calls.
 * Then: only catalog tools run, limits stop unsafe loops, and final output stays user-safe.
 */

import {
  AiEmployeeToolLoop,
  type IAiEmployeeTool,
} from "./ai-employee-tool-loop";

function createTool(props?: Partial<IAiEmployeeTool>): IAiEmployeeTool {
  return {
    source: "mcp",
    definition: {
      type: "function",
      function: {
        name: "mcp__project__find",
        description: "Find a record",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
      },
    },
    execute: jest.fn(async (args) => ({ id: args["id"], ok: true })),
    ...props,
  };
}

describe("Given: a bounded AI employee tool loop", () => {
  /**
   * BDD Scenario
   * Given: OpenRouter requests one available MCP tool before answering.
   * When: the loop executes and replays the result.
   * Then: the final text and redacted trace identify the employee work without exposing raw arguments.
   */
  it("When: an available tool is requested Then: its result is replayed before final text", async () => {
    const tool = createTool();
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        text: "",
        toolCalls: [
          {
            id: "call-1",
            type: "function",
            function: {
              name: "mcp__project__find",
              arguments: '{"id":"record-1"}',
            },
          },
        ],
        billing: {} as any,
      })
      .mockResolvedValueOnce({
        text: "Record 1 is available.",
        billing: {} as any,
      });

    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Find record 1" }],
      modelCandidateIds: ["openai/gpt-5.5"],
      tools: [tool],
      generate,
    });

    expect(tool.execute).toHaveBeenCalledWith({ id: "record-1" });
    expect(generate.mock.calls[1][0].context).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "tool",
          tool_call_id: "call-1",
          content: '{"id":"record-1","ok":true}',
        }),
      ]),
    );
    expect(result).toMatchObject({
      finalText: "Record 1 is available.",
      selectedModelId: "openai/gpt-5.5",
      trace: {
        stepCount: 2,
        stopReason: "final_text",
        exposedToolNames: ["mcp__project__find"],
        calls: [
          {
            callId: "call-1",
            name: "mcp__project__find",
            source: "mcp",
            status: "success",
          },
        ],
      },
    });
    expect(result.trace).not.toHaveProperty("arguments");
    expect(result.trace).not.toHaveProperty("results");
  });

  /**
   * BDD Scenario
   * Given: a model requests an unknown tool or malformed arguments.
   * When: the loop validates catalog membership and JSON shape.
   * Then: neither call executes and a safe terminal message is returned.
   */
  it.each([
    ["unknown_tool", "{}"],
    ["mcp__project__find", '{"id":'],
  ])(
    "When: invalid call %s is produced Then: execution fails closed",
    async (name, args) => {
      const tool = createTool();
      const result = await new AiEmployeeToolLoop().run({
        context: [{ role: "user", content: "Find a record" }],
        modelCandidateIds: ["openai/gpt-5.5"],
        tools: [tool],
        generate: jest.fn(async () => ({
          text: "",
          toolCalls: [
            {
              id: "invalid-call",
              type: "function" as const,
              function: { name, arguments: args },
            },
          ],
          billing: {} as any,
        })),
      });

      expect(tool.execute).not.toHaveBeenCalled();
      expect(result.trace.stopReason).toBe("invalid_tool_call");
      expect(result.finalText).not.toContain(name);
      expect(result.finalText).not.toContain(args);
    },
  );

  /**
   * BDD Scenario
   * Given: a model repeats the same side-effecting call beyond the configured limit.
   * When: the loop observes consecutive call signatures.
   * Then: the third call is blocked and only the first two execute.
   */
  it("When: one call repeats too often Then: repeated execution is stopped", async () => {
    const tool = createTool();
    let callIndex = 0;
    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Repeat" }],
      modelCandidateIds: ["openai/gpt-5.5"],
      tools: [tool],
      generate: jest.fn(async () => ({
        text: "",
        toolCalls: [
          {
            id: `call-${++callIndex}`,
            type: "function" as const,
            function: {
              name: "mcp__project__find",
              arguments: '{"id":"same-record"}',
            },
          },
        ],
        billing: {} as any,
      })),
      limits: {
        maxIterations: 6,
        maxRepeatedCalls: 2,
      },
    });

    expect(tool.execute).toHaveBeenCalledTimes(2);
    expect(result.trace.stopReason).toBe("repeated_tool_call");
  });

  /**
   * BDD Scenario
   * Given: a tool does not finish or returns an oversized result.
   * When: per-call safety limits are applied.
   * Then: the loop stops with a bounded reason and no raw result is surfaced.
   */
  it.each([
    [
      "tool_timeout",
      createTool({
        execute: jest.fn(() => new Promise(() => undefined)),
      }),
      { toolTimeoutMs: 1 },
    ],
    [
      "tool_result_too_large",
      createTool({
        execute: jest.fn(async () => "result-larger-than-limit"),
      }),
      { maxResultBytes: 4 },
    ],
  ])(
    "When: a tool reaches %s Then: its result is bounded",
    async (expectedReason, tool, limits) => {
      const result = await new AiEmployeeToolLoop().run({
        context: [{ role: "user", content: "Run tool" }],
        modelCandidateIds: ["openai/gpt-5.5"],
        tools: [tool as IAiEmployeeTool],
        generate: jest.fn(async () => ({
          text: "",
          toolCalls: [
            {
              id: "call-1",
              type: "function" as const,
              function: {
                name: "mcp__project__find",
                arguments: '{"id":"record"}',
              },
            },
          ],
          billing: {} as any,
        })),
        limits,
      });

      expect(result.trace.stopReason).toBe(expectedReason);
      expect(result.trace.calls).toEqual([]);
    },
  );

  /**
   * BDD Scenario
   * Given: the primary model fails before any tool executes and a fallback model succeeds.
   * When: the first loop iteration is generated.
   * Then: fallback is allowed before side effects and becomes the locked continuation model.
   */
  it("When: primary generation fails before tools Then: one fallback model is used safely", async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        error: new Error("primary failed"),
        billing: null,
      })
      .mockResolvedValueOnce({ text: "Fallback answer", billing: {} as any });

    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Answer" }],
      modelCandidateIds: ["primary", "fallback"],
      tools: [],
      generate,
    });

    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: "primary" }),
    );
    expect(generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "fallback" }),
    );
    expect(result).toMatchObject({
      selectedModelId: "fallback",
      finalText: "Fallback answer",
      trace: { stopReason: "final_text" },
    });
  });

  /**
   * BDD Scenario
   * Given: a tool has already executed using the primary model.
   * When: the continuation generation fails.
   * Then: the loop does not switch models and risk replaying the side effect.
   */
  it("When: continuation fails after a tool Then: fallback remains locked", async () => {
    const tool = createTool();
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        text: "",
        toolCalls: [
          {
            id: "call-1",
            type: "function",
            function: {
              name: "mcp__project__find",
              arguments: '{"id":"record-1"}',
            },
          },
        ],
        billing: {} as any,
      })
      .mockResolvedValueOnce({
        error: new Error("continuation failed"),
        billing: null,
      });

    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Find record 1" }],
      modelCandidateIds: ["primary", "fallback"],
      tools: [tool],
      generate,
    });

    expect(tool.execute).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).not.toHaveBeenCalledWith(
      expect.objectContaining({ model: "fallback" }),
    );
    expect(result.trace.stopReason).toBe("model_error");
  });

  /**
   * BDD Scenario
   * Given: every model candidate fails before any side effect.
   * When: fallback candidates are exhausted.
   * Then: the loop returns a model failure without executing a tool.
   */
  it("When: every model fails Then: the loop stops without side effects", async () => {
    const tool = createTool();
    const generate = jest.fn(async () => ({
      error: new Error("generation failed"),
      billing: null,
    }));

    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Find record" }],
      modelCandidateIds: ["primary", "fallback"],
      tools: [tool],
      generate,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(tool.execute).not.toHaveBeenCalled();
    expect(result.trace.stopReason).toBe("model_error");
  });

  /**
   * BDD Scenario
   * Given: the model keeps requesting distinct valid tools.
   * When: the configured iteration limit is reached.
   * Then: the loop stops before an unbounded next generation.
   */
  it("When: tool work exceeds max iterations Then: the loop stops deterministically", async () => {
    const tool = createTool();
    let callIndex = 0;
    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Keep searching" }],
      modelCandidateIds: ["primary"],
      tools: [tool],
      generate: jest.fn(async () => {
        callIndex += 1;

        return {
          text: "",
          toolCalls: [
            {
              id: `call-${callIndex}`,
              type: "function" as const,
              function: {
                name: "mcp__project__find",
                arguments: JSON.stringify({ id: `record-${callIndex}` }),
              },
            },
          ],
          billing: {} as any,
        };
      }),
      limits: { maxIterations: 2 },
    });

    expect(tool.execute).toHaveBeenCalledTimes(2);
    expect(result.trace).toMatchObject({
      stepCount: 2,
      stopReason: "max_iterations",
    });
  });

  /**
   * BDD Scenario
   * Given: OpenRouter does not return before the total work deadline.
   * When: the deadline expires.
   * Then: the loop returns a bounded timeout result.
   */
  it("When: model generation exceeds the total deadline Then: total timeout wins", async () => {
    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Wait forever" }],
      modelCandidateIds: ["primary"],
      tools: [],
      generate: jest.fn(() => new Promise(() => undefined)),
      limits: { totalTimeoutMs: 1 },
    });

    expect(result.trace.stopReason).toBe("total_timeout");
  });

  /**
   * BDD Scenario
   * Given: a catalog tool throws a private implementation error.
   * When: the employee loop handles the failure.
   * Then: only a generic safe error is returned to the chat.
   */
  it("When: a tool throws Then: private details are not surfaced", async () => {
    const tool = createTool({
      execute: jest.fn(async () => {
        throw new Error("database password must stay private");
      }),
    });
    const result = await new AiEmployeeToolLoop().run({
      context: [{ role: "user", content: "Run tool" }],
      modelCandidateIds: ["primary"],
      tools: [tool],
      generate: jest.fn(async () => ({
        text: "",
        toolCalls: [
          {
            id: "call-1",
            type: "function" as const,
            function: {
              name: "mcp__project__find",
              arguments: '{"id":"record"}',
            },
          },
        ],
        billing: {} as any,
      })),
    });

    expect(result.trace.stopReason).toBe("tool_error");
    expect(result.finalText).not.toContain("password");
  });
});

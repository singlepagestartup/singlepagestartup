import type {
  IOpenRouterGenerateResult,
  IOpenRouterRequestMessage,
  IOpenRouterTool,
  IOpenRouterToolCall,
} from "@sps/shared-third-parties";

export interface IAiEmployeeToolLoopLimits {
  maxIterations: number;
  totalTimeoutMs: number;
  toolTimeoutMs: number;
  maxResultBytes: number;
  maxRepeatedCalls: number;
}

export const AI_EMPLOYEE_TOOL_LOOP_DEFAULTS: IAiEmployeeToolLoopLimits = {
  maxIterations: 6,
  totalTimeoutMs: 120_000,
  toolTimeoutMs: 30_000,
  maxResultBytes: 32 * 1024,
  maxRepeatedCalls: 2,
};

export type TAiEmployeeToolSource = "skill" | "knowledge" | "mcp";

export interface IAiEmployeeTool {
  definition: IOpenRouterTool;
  source: TAiEmployeeToolSource;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  validateArguments?: (args: Record<string, unknown>) => void;
  audit?: (args: Record<string, unknown>) => Record<string, unknown>;
}

export interface IAiEmployeeToolTraceEntry {
  callId: string;
  name: string;
  source: TAiEmployeeToolSource;
  resultBytes: number;
  status: "success";
  metadata?: Record<string, unknown>;
}

export type TAiEmployeeToolLoopStopReason =
  | "final_text"
  | "max_iterations"
  | "total_timeout"
  | "model_error"
  | "invalid_tool_call"
  | "repeated_tool_call"
  | "tool_timeout"
  | "tool_error"
  | "tool_result_too_large";

export interface IAiEmployeeToolLoopResult {
  finalText: string;
  selectedModelId: string | null;
  context: IOpenRouterRequestMessage[];
  trace: {
    enabled: boolean;
    stepCount: number;
    exposedToolNames: string[];
    calls: IAiEmployeeToolTraceEntry[];
    stopReason: TAiEmployeeToolLoopStopReason;
    durationMs: number;
  };
}

export interface IAiEmployeeToolLoopProps {
  context: IOpenRouterRequestMessage[];
  modelCandidateIds: string[];
  tools: IAiEmployeeTool[];
  generate: (props: {
    model: string;
    context: IOpenRouterRequestMessage[];
    tools: IOpenRouterTool[];
  }) => Promise<IOpenRouterGenerateResult>;
  limits?: Partial<IAiEmployeeToolLoopLimits>;
  now?: () => number;
}

class ToolLoopStopError extends Error {
  reason: TAiEmployeeToolLoopStopReason;

  constructor(reason: TAiEmployeeToolLoopStopReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export class AiEmployeeToolLoop {
  async run(
    props: IAiEmployeeToolLoopProps,
  ): Promise<IAiEmployeeToolLoopResult> {
    const limits = {
      ...AI_EMPLOYEE_TOOL_LOOP_DEFAULTS,
      ...props.limits,
    };
    const now = props.now || Date.now;
    const startedAt = now();
    const context = [...props.context];
    const traceCalls: IAiEmployeeToolTraceEntry[] = [];
    const toolsByName = new Map<string, IAiEmployeeTool>();

    for (const tool of props.tools) {
      const name = tool.definition.function.name;

      if (toolsByName.has(name)) {
        throw new Error(
          `Configuration error. Duplicate employee tool: ${name}`,
        );
      }

      toolsByName.set(name, tool);
    }

    const modelCandidateIds = Array.from(
      new Set(
        props.modelCandidateIds.map((value) => value.trim()).filter(Boolean),
      ),
    );

    if (!modelCandidateIds.length) {
      throw new Error(
        "Configuration error. No OpenRouter model candidates provided",
      );
    }

    let selectedModelId: string | null = null;
    let previousCallSignature: string | null = null;
    let repeatedCallCount = 0;

    try {
      for (
        let iteration = 1;
        iteration <= limits.maxIterations;
        iteration += 1
      ) {
        this.assertWithinTotalTimeout({
          startedAt,
          now,
          totalTimeoutMs: limits.totalTimeoutMs,
        });
        const generation = await this.generateWithSafeFallback({
          candidateIds: selectedModelId ? [selectedModelId] : modelCandidateIds,
          context,
          generate: props.generate,
          tools: props.tools.map((tool) => tool.definition),
          timeoutMs: Math.max(1, limits.totalTimeoutMs - (now() - startedAt)),
        });

        selectedModelId = generation.modelId;

        if (generation.result.toolCalls?.length) {
          context.push({
            role: "assistant",
            content: generation.result.text || "",
            tool_calls: generation.result.toolCalls,
          });

          for (const toolCall of generation.result.toolCalls) {
            this.assertWithinTotalTimeout({
              startedAt,
              now,
              totalTimeoutMs: limits.totalTimeoutMs,
            });
            const signature = `${toolCall.function.name}:${toolCall.function.arguments}`;

            if (signature === previousCallSignature) {
              repeatedCallCount += 1;
            } else {
              previousCallSignature = signature;
              repeatedCallCount = 1;
            }

            if (repeatedCallCount > limits.maxRepeatedCalls) {
              throw new ToolLoopStopError(
                "repeated_tool_call",
                "The employee repeated the same tool call too many times.",
              );
            }

            const remainingTotalTimeoutMs = Math.max(
              1,
              limits.totalTimeoutMs - (now() - startedAt),
            );
            const isBoundedByTotalTimeout =
              remainingTotalTimeoutMs <= limits.toolTimeoutMs;
            const toolResult = await this.executeToolCall({
              call: toolCall,
              maxResultBytes: limits.maxResultBytes,
              timeoutMs: Math.min(
                limits.toolTimeoutMs,
                remainingTotalTimeoutMs,
              ),
              timeoutReason: isBoundedByTotalTimeout
                ? "total_timeout"
                : "tool_timeout",
              toolsByName,
            });

            traceCalls.push(toolResult.trace);
            context.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult.serialized,
            });
          }

          continue;
        }

        const finalText = generation.result.text.trim();

        if (!finalText) {
          throw new ToolLoopStopError(
            "model_error",
            "The employee model returned neither text nor a tool call.",
          );
        }

        return this.toResult({
          context,
          durationMs: now() - startedAt,
          exposedToolNames: Array.from(toolsByName.keys()),
          finalText,
          selectedModelId,
          stepCount: iteration,
          stopReason: "final_text",
          traceCalls,
        });
      }

      throw new ToolLoopStopError(
        "max_iterations",
        "The employee reached the maximum number of work steps.",
      );
    } catch (error) {
      const normalized = this.toStopError(error);

      return this.toResult({
        context,
        durationMs: now() - startedAt,
        exposedToolNames: Array.from(toolsByName.keys()),
        finalText: normalized.message,
        selectedModelId,
        stepCount: Math.min(
          limits.maxIterations,
          traceCalls.length + (selectedModelId ? 1 : 0),
        ),
        stopReason: normalized.reason,
        traceCalls,
      });
    }
  }

  private async generateWithSafeFallback(props: {
    candidateIds: string[];
    context: IOpenRouterRequestMessage[];
    tools: IOpenRouterTool[];
    generate: IAiEmployeeToolLoopProps["generate"];
    timeoutMs: number;
  }) {
    let lastError = "OpenRouter generation failed";

    for (const modelId of props.candidateIds) {
      const result = await this.withTimeout(
        props.generate({
          model: modelId,
          context: props.context,
          tools: props.tools,
        }),
        props.timeoutMs,
        "total_timeout",
        "The employee reached the total work timeout.",
      );

      if (!("error" in result)) {
        return { modelId, result };
      }

      lastError = this.toErrorMessage(result.error);
    }

    throw new ToolLoopStopError("model_error", lastError);
  }

  private async executeToolCall(props: {
    call: IOpenRouterToolCall;
    maxResultBytes: number;
    timeoutMs: number;
    timeoutReason: "tool_timeout" | "total_timeout";
    toolsByName: Map<string, IAiEmployeeTool>;
  }) {
    const tool = props.toolsByName.get(props.call.function.name);

    if (!tool) {
      throw new ToolLoopStopError(
        "invalid_tool_call",
        "The employee requested an unavailable tool.",
      );
    }

    let args: Record<string, unknown>;

    try {
      const parsed = JSON.parse(props.call.function.arguments);

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Tool arguments must be an object");
      }

      args = parsed as Record<string, unknown>;
      tool.validateArguments?.(args);
    } catch {
      throw new ToolLoopStopError(
        "invalid_tool_call",
        "The employee produced invalid tool arguments.",
      );
    }

    let result: unknown;

    try {
      result = await this.withTimeout(
        tool.execute(args),
        props.timeoutMs,
        props.timeoutReason,
        props.timeoutReason === "total_timeout"
          ? "The employee reached the total work timeout."
          : "The employee tool did not finish before its timeout.",
      );
    } catch (error) {
      if (error instanceof ToolLoopStopError) {
        throw error;
      }

      throw new ToolLoopStopError(
        "tool_error",
        "The employee could not complete the requested tool operation.",
      );
    }

    const serialized = this.serializeToolResult(result);
    const resultBytes = Buffer.byteLength(serialized, "utf8");

    if (resultBytes > props.maxResultBytes) {
      throw new ToolLoopStopError(
        "tool_result_too_large",
        "The employee tool returned more data than can be processed safely.",
      );
    }

    return {
      serialized,
      trace: {
        callId: props.call.id,
        name: props.call.function.name,
        source: tool.source,
        resultBytes,
        status: "success" as const,
        ...(tool.audit ? { metadata: tool.audit(args) } : {}),
      },
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    reason: TAiEmployeeToolLoopStopReason,
    message: string,
  ) {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          timeout = setTimeout(() => {
            reject(new ToolLoopStopError(reason, message));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private assertWithinTotalTimeout(props: {
    startedAt: number;
    now: () => number;
    totalTimeoutMs: number;
  }) {
    if (props.now() - props.startedAt >= props.totalTimeoutMs) {
      throw new ToolLoopStopError(
        "total_timeout",
        "The employee reached the total work timeout.",
      );
    }
  }

  private serializeToolResult(value: unknown) {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      throw new ToolLoopStopError(
        "tool_error",
        "The employee tool returned an unsupported result.",
      );
    }
  }

  private toStopError(error: unknown) {
    if (error instanceof ToolLoopStopError) {
      return error;
    }

    return new ToolLoopStopError(
      "tool_error",
      "The employee could not complete the requested work.",
    );
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private toResult(props: {
    context: IOpenRouterRequestMessage[];
    durationMs: number;
    exposedToolNames: string[];
    finalText: string;
    selectedModelId: string | null;
    stepCount: number;
    stopReason: TAiEmployeeToolLoopStopReason;
    traceCalls: IAiEmployeeToolTraceEntry[];
  }): IAiEmployeeToolLoopResult {
    return {
      finalText: props.finalText,
      selectedModelId: props.selectedModelId,
      context: props.context,
      trace: {
        enabled: Boolean(props.exposedToolNames.length),
        stepCount: props.stepCount,
        exposedToolNames: props.exposedToolNames,
        calls: props.traceCalls,
        stopReason: props.stopReason,
        durationMs: props.durationMs,
      },
    };
  }
}

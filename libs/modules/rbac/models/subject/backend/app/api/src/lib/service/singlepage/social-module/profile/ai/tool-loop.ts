import type {
  IOpenRouterGenerateResult,
  IOpenRouterRequestMessage,
  IOpenRouterTool,
  IOpenRouterToolCall,
} from "@sps/shared-third-parties";

export interface ISocialProfileAiToolLoopLimits {
  maxIterations: number;
  totalTimeoutMs: number;
  toolTimeoutMs: number;
  maxResultBytes: number;
  maxRepeatedCalls: number;
}

export const SOCIAL_PROFILE_AI_TOOL_LOOP_DEFAULTS: ISocialProfileAiToolLoopLimits =
  {
    maxIterations: 50,
    totalTimeoutMs: 300_000,
    toolTimeoutMs: 30_000,
    maxResultBytes: 32 * 1024,
    maxRepeatedCalls: 2,
  };

export type TSocialProfileAiToolSource = "skill" | "knowledge" | "mcp";

export interface ISocialProfileAiTool {
  definition: IOpenRouterTool;
  source: TSocialProfileAiToolSource;
  display?: {
    label: string;
    serverId?: string;
  };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  validateArguments?: (args: Record<string, unknown>) => void;
  audit?: (args: Record<string, unknown>) => Record<string, unknown>;
}

interface ISocialProfileAiToolEventBase {
  callId: string;
  name: string;
  source: TSocialProfileAiToolSource;
  label: string;
  serverId?: string;
  selectedModelId: string;
}

export type TSocialProfileAiToolLoopEvent =
  | (ISocialProfileAiToolEventBase & { type: "tool_requested" })
  | (ISocialProfileAiToolEventBase & { type: "tool_started" })
  | (ISocialProfileAiToolEventBase & {
      type: "tool_succeeded";
      resultBytes: number;
    })
  | (ISocialProfileAiToolEventBase & {
      type: "tool_failed";
      reason: TSocialProfileAiToolLoopStopReason;
    })
  | {
      type: "run_completed";
      selectedModelId: string | null;
      stopReason: TSocialProfileAiToolLoopStopReason;
      durationMs: number;
    };

export interface ISocialProfileAiToolTraceEntry {
  callId: string;
  name: string;
  source: TSocialProfileAiToolSource;
  resultBytes: number;
  status: "success";
  metadata?: Record<string, unknown>;
}

export type TSocialProfileAiToolLoopStopReason =
  | "final_text"
  | "max_iterations"
  | "total_timeout"
  | "model_error"
  | "invalid_tool_call"
  | "repeated_tool_call"
  | "tool_timeout"
  | "tool_error"
  | "tool_result_too_large";

export interface ISocialProfileAiToolLoopResult {
  finalText: string;
  selectedModelId: string | null;
  context: IOpenRouterRequestMessage[];
  trace: {
    enabled: boolean;
    stepCount: number;
    exposedToolNames: string[];
    calls: ISocialProfileAiToolTraceEntry[];
    stopReason: TSocialProfileAiToolLoopStopReason;
    durationMs: number;
  };
}

export interface ISocialProfileAiToolLoopProps {
  context: IOpenRouterRequestMessage[];
  language?: string;
  modelCandidateIds: string[];
  tools: ISocialProfileAiTool[];
  generate: (props: {
    model: string;
    context: IOpenRouterRequestMessage[];
    tools: IOpenRouterTool[];
  }) => Promise<IOpenRouterGenerateResult>;
  onEvent?: (event: TSocialProfileAiToolLoopEvent) => Promise<void> | void;
  limits?: Partial<ISocialProfileAiToolLoopLimits>;
  now?: () => number;
}

class ToolLoopStopError extends Error {
  reason: TSocialProfileAiToolLoopStopReason;

  constructor(reason: TSocialProfileAiToolLoopStopReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export class SocialProfileAiToolLoop {
  async run(
    props: ISocialProfileAiToolLoopProps,
  ): Promise<ISocialProfileAiToolLoopResult> {
    const limits = {
      ...SOCIAL_PROFILE_AI_TOOL_LOOP_DEFAULTS,
      ...props.limits,
    };
    const now = props.now || Date.now;
    const startedAt = now();
    const context = [...props.context];
    const traceCalls: ISocialProfileAiToolTraceEntry[] = [];
    const toolsByName = new Map<string, ISocialProfileAiTool>();

    for (const tool of props.tools) {
      const name = tool.definition.function.name;

      if (toolsByName.has(name)) {
        throw new Error(
          `Configuration error. Duplicate social.profile tool: ${name}`,
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
                "The same tool call was repeated too many times.",
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
              onEvent: props.onEvent,
              selectedModelId,
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
            "The model returned neither text nor a tool call.",
          );
        }

        const result = this.toResult({
          context,
          durationMs: now() - startedAt,
          exposedToolNames: Array.from(toolsByName.keys()),
          finalText,
          selectedModelId,
          stepCount: iteration,
          stopReason: "final_text",
          traceCalls,
        });

        await this.emitEvent(props.onEvent, {
          type: "run_completed",
          selectedModelId,
          stopReason: result.trace.stopReason,
          durationMs: result.trace.durationMs,
        });

        return result;
      }

      throw new ToolLoopStopError(
        "max_iterations",
        "The maximum number of task steps was reached.",
      );
    } catch (error) {
      const normalized = this.toStopError(error);

      const result = this.toResult({
        context,
        durationMs: now() - startedAt,
        exposedToolNames: Array.from(toolsByName.keys()),
        finalText: this.toUserFacingStopMessage(
          normalized.reason,
          props.language,
        ),
        selectedModelId,
        stepCount: Math.min(
          limits.maxIterations,
          traceCalls.length + (selectedModelId ? 1 : 0),
        ),
        stopReason: normalized.reason,
        traceCalls,
      });

      await this.emitEvent(props.onEvent, {
        type: "run_completed",
        selectedModelId,
        stopReason: result.trace.stopReason,
        durationMs: result.trace.durationMs,
      });

      return result;
    }
  }

  private async generateWithSafeFallback(props: {
    candidateIds: string[];
    context: IOpenRouterRequestMessage[];
    tools: IOpenRouterTool[];
    generate: ISocialProfileAiToolLoopProps["generate"];
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
        "The task exceeded its total time limit.",
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
    onEvent?: ISocialProfileAiToolLoopProps["onEvent"];
    selectedModelId: string;
    timeoutMs: number;
    timeoutReason: "tool_timeout" | "total_timeout";
    toolsByName: Map<string, ISocialProfileAiTool>;
  }) {
    const tool = props.toolsByName.get(props.call.function.name);

    if (!tool) {
      throw new ToolLoopStopError(
        "invalid_tool_call",
        "The requested tool is unavailable.",
      );
    }

    const eventBase: ISocialProfileAiToolEventBase = {
      callId: props.call.id,
      name: props.call.function.name,
      source: tool.source,
      label: tool.display?.label || props.call.function.name,
      ...(tool.display?.serverId ? { serverId: tool.display.serverId } : {}),
      selectedModelId: props.selectedModelId,
    };

    await this.emitEvent(props.onEvent, {
      type: "tool_requested",
      ...eventBase,
    });

    try {
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
          "The tool call contained invalid arguments.",
        );
      }

      await this.emitEvent(props.onEvent, {
        type: "tool_started",
        ...eventBase,
      });

      let result: unknown;

      try {
        result = await this.withTimeout(
          tool.execute(args),
          props.timeoutMs,
          props.timeoutReason,
          props.timeoutReason === "total_timeout"
            ? "The task exceeded its total time limit."
            : "The tool did not finish before its timeout.",
        );
      } catch (error) {
        if (error instanceof ToolLoopStopError) {
          throw error;
        }

        throw new ToolLoopStopError(
          "tool_error",
          "The task could not be completed.",
        );
      }

      const serialized = this.serializeToolResult(result);
      const resultBytes = Buffer.byteLength(serialized, "utf8");

      if (resultBytes > props.maxResultBytes) {
        throw new ToolLoopStopError(
          "tool_result_too_large",
          "The tool returned more data than can be processed safely.",
        );
      }

      const trace = {
        callId: props.call.id,
        name: props.call.function.name,
        source: tool.source,
        resultBytes,
        status: "success" as const,
        ...(tool.audit ? { metadata: tool.audit(args) } : {}),
      };

      await this.emitEvent(props.onEvent, {
        type: "tool_succeeded",
        ...eventBase,
        resultBytes,
      });

      return { serialized, trace };
    } catch (error) {
      const normalized = this.toStopError(error);

      await this.emitEvent(props.onEvent, {
        type: "tool_failed",
        ...eventBase,
        reason: normalized.reason,
      });

      throw normalized;
    }
  }

  private async emitEvent(
    onEvent: ISocialProfileAiToolLoopProps["onEvent"],
    event: TSocialProfileAiToolLoopEvent,
  ) {
    if (!onEvent) {
      return;
    }

    try {
      await onEvent(event);
    } catch {
      // Progress projection is best-effort and must never break social.profile tool execution.
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    reason: TSocialProfileAiToolLoopStopReason,
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
        "The task exceeded its total time limit.",
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
        "The tool returned an unsupported result.",
      );
    }
  }

  private toUserFacingStopMessage(
    reason: TSocialProfileAiToolLoopStopReason,
    language?: string,
  ) {
    const isRussian = language?.toLowerCase().startsWith("ru") ?? false;
    const messages: Record<
      Exclude<TSocialProfileAiToolLoopStopReason, "final_text">,
      { en: string; ru: string }
    > = {
      model_error: {
        en: "A valid response could not be received from the model. Please try again or select another model.",
        ru: "Не удалось получить корректный ответ от модели. Попробуйте повторить запрос или выбрать другую модель.",
      },
      invalid_tool_call: {
        en: "The requested tool could not be used because the model supplied invalid data. Please try again.",
        ru: "Не удалось использовать запрошенный инструмент: модель передала некорректные данные. Попробуйте повторить запрос.",
      },
      repeated_tool_call: {
        en: "The task could not be completed because the same tool request was repeated. Please clarify the request and try again.",
        ru: "Не получилось завершить задачу: один и тот же запрос к инструменту повторялся несколько раз. Уточните задачу и попробуйте снова.",
      },
      max_iterations: {
        en: "The task could not be completed within the allowed number of steps. Please clarify the request and try again.",
        ru: "Не получилось завершить задачу за допустимое количество шагов. Уточните запрос и попробуйте снова.",
      },
      total_timeout: {
        en: "The task took too long and was stopped. Please try again.",
        ru: "Задача выполнялась слишком долго и была остановлена. Попробуйте повторить запрос.",
      },
      tool_timeout: {
        en: "The tool did not finish in time. Please try again.",
        ru: "Инструмент не успел завершить работу. Попробуйте повторить запрос.",
      },
      tool_error: {
        en: "The task could not be completed because a tool failed. Please try again.",
        ru: "Не получилось завершить задачу из-за ошибки инструмента. Попробуйте повторить запрос.",
      },
      tool_result_too_large: {
        en: "The tool returned too much data. Please narrow the request and try again.",
        ru: "Инструмент вернул слишком большой объём данных. Уточните запрос и попробуйте снова.",
      },
    };

    if (reason === "final_text") {
      return isRussian
        ? "Не получилось завершить задачу. Попробуйте повторить запрос."
        : "The task could not be completed. Please try again.";
    }

    return messages[reason][isRussian ? "ru" : "en"];
  }

  private toStopError(error: unknown) {
    if (error instanceof ToolLoopStopError) {
      return error;
    }

    return new ToolLoopStopError(
      "tool_error",
      "The task could not be completed.",
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
    stopReason: TSocialProfileAiToolLoopStopReason;
    traceCalls: ISocialProfileAiToolTraceEntry[];
  }): ISocialProfileAiToolLoopResult {
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

import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { McpToolResultTooLarge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client";
import type { IModel as IAttempt } from "@sps/agent/models/work-attempt/sdk/model";
import type { ICustomerWorkRun } from "@sps/rbac/models/subject/sdk/model";
import {
  publicMcpParameters,
  publicMcpResult,
  publicMcpSchemaFields,
  type IAiExecutionActionStep,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ai-execution-action";
import type {
  IOpenRouterRequestMessage,
  IOpenRouterToolCall,
} from "@sps/shared-third-parties";
import type { Service as WorkAttempt } from "./index";
import {
  workResponseState,
  type TWorkResponseState,
} from "@sps/shared-third-parties";

type TCustomerWork = WorkAttempt["modules"]["rbac"]["subject"]["customerWork"];
type TSession = Pick<
  NonNullable<Awaited<ReturnType<TCustomerWork["openMcpForRun"]>>>,
  "tools" | "describe" | "call" | "close" | "authorityKey"
>;
const exchangeSchema = z.object({
  call: z.object({
    id: z.string(),
    type: z.literal("function"),
    function: z.object({ name: z.string(), arguments: z.string() }),
  }),
  result: z.string(),
  responseState: workResponseState.optional(),
});
type TExchange = z.infer<typeof exchangeSchema>;

export interface IMcpRound {
  stepKey: string;
  digest: string;
  session: TSession;
  exchanges: TExchange[];
}

export interface IMcpAdvice {
  stageId: string;
  publicationId: string;
  history: IOpenRouterRequestMessage[];
  responseStates?: Record<string, TWorkResponseState>;
  evidence: string;
}

export class McpWork {
  constructor(private readonly service: WorkAttempt) {}

  async publish(attempt: IAttempt) {
    const record = JSON.parse(attempt.result?.text || "null");
    if (!record?.step) {
      return;
    }
    await this.service.modules.rbac.subject.customerWork.recordMcpStep({
      storeId: attempt.storeId,
      taskId: attempt.taskId,
      eventId: attempt.eventId,
      assigneeId: attempt.assigneeId,
      assignmentRevision: attempt.assignmentRevision,
      stageId: attempt.stageId,
      publicationId: attempt.publicationId,
      model: attempt.model,
      step: { ...record.step, id: attempt.id },
    });
  }

  async plan(
    input: ICustomerWorkRun,
    perform: (round: IMcpRound, advice: IMcpAdvice) => Promise<IAttempt>,
  ): Promise<{ blocked?: IAttempt; advice?: IMcpAdvice }> {
    const session =
      await this.service.modules.rbac.subject.customerWork.openMcpForRun(input);
    if (!session) {
      return {};
    }
    try {
      if (!session.tools.length) {
        return {};
      }
      const { task } = await this.service.modules.crm.task.getWork({
        ...input,
        expectedAssignmentRevision: input.assignmentRevision,
      });
      const exchanges: TExchange[] = [];
      const catalog = [...session.tools].sort((a, b) =>
        a.function.name.localeCompare(b.function.name),
      );
      const advice: IMcpAdvice = {
        stageId: task.stageId,
        publicationId: task.publicationId,
        history: [],
        evidence: "",
      };
      for (let index = 0; index < 2; index++) {
        const stepKey = `mcp-tools-${index + 1}`;
        const digest = createHash("sha256")
          .update(
            JSON.stringify([
              input.assigneeId,
              input.assignmentRevision,
              task.stageId,
              task.publicationId,
              session.authorityKey,
              catalog,
              exchanges,
            ]),
          )
          .digest("hex");
        const attempt = await perform(
          { stepKey, digest, exchanges, session },
          advice,
        );
        if (attempt.state !== "delivered") {
          return { blocked: attempt };
        }
        if (attempt.requestDigest !== digest) {
          // An action may already have run with the earlier connection. Do not replay it or reuse its output.
          return {};
        }
        const exchange = exchangeSchema
          .nullable()
          .parse(JSON.parse(attempt.result!.text));
        if (!exchange) {
          break;
        }
        exchanges.push(exchange);
        if (exchange.responseState) {
          const states = (advice.responseStates ??= Object.create(null));
          states[exchange.call.id] = exchange.responseState;
        }
        advice.history.push(
          { role: "assistant", content: "", tool_calls: [exchange.call] },
          {
            role: "tool",
            tool_call_id: exchange.call.id,
            content: exchange.result,
          },
        );
      }
      advice.evidence = JSON.stringify(
        exchanges.map(({ call, result }) => ({
          tool: call.function.name,
          result,
        })),
      );
      return exchanges.length ? { advice } : {};
    } finally {
      await session.close();
    }
  }

  async call(
    round: IMcpRound,
    calls: IOpenRouterToolCall[] | undefined,
    responseState?: TWorkResponseState,
  ): Promise<string> {
    if (!calls?.length || calls.length !== 1) {
      return "null";
    }
    const [call] = calls;
    if (
      !round.session.tools.some(
        (tool) => tool.function.name === call.function.name,
      ) ||
      Buffer.byteLength(call.function.arguments) > 8192
    ) {
      return "null";
    }
    const target = round.session.describe(call.function.name);
    if (!target) {
      return "null";
    }
    const startedAt = new Date().toISOString();
    const step: IAiExecutionActionStep = {
      id: call.id,
      kind: "mcp",
      serverId: target.serverId,
      toolName: target.name,
      label: target.name,
      status: "failed",
      startedAt,
    };
    let result: string;
    try {
      const args = z
        .record(z.string(), z.unknown())
        .parse(JSON.parse(call.function.arguments));
      const repeated = round.exchanges.some(({ call: previous }) => {
        if (previous.id === call.id) {
          return true;
        }
        if (previous.function.name !== call.function.name) {
          return false;
        }
        try {
          return isDeepStrictEqual(
            args,
            JSON.parse(previous.function.arguments),
          );
        } catch {
          return false;
        }
      });
      if (repeated) {
        return "null";
      }
      step.parameters = publicMcpParameters(args);
      const response = await round.session.call(call.function.name, args);
      let publicData: unknown = response.structuredContent;
      if (publicData === undefined) {
        try {
          publicData = JSON.parse(response.text);
        } catch {
          publicData = undefined;
        }
      }
      const envelope = z
        .object({ ok: z.boolean(), data: z.unknown().optional() })
        .safeParse(publicData).data;
      const failed = response.isError || envelope?.ok === false;
      step.status = failed ? "failed" : "succeeded";
      if (failed) {
        step.errorCode = "tool_error";
      } else {
        const data = envelope?.data ?? publicData;
        const count =
          target.serverId === "singlepagestartup" &&
          (target.name === "model-record-count" ||
            target.name === "relation-record-count") &&
          typeof data === "number" &&
          Number.isSafeInteger(data) &&
          data >= 0;
        step.resultSummary = publicMcpResult(count ? { count: data } : data);
        step.schemaFields = publicMcpSchemaFields(
          target.serverId,
          target.name,
          envelope?.data ?? publicData,
        );
      }
      result = JSON.stringify({
        isError: failed,
        text: response.text,
        structuredContent: response.structuredContent,
      });
      step.resultBytes = Buffer.byteLength(result);
    } catch (error) {
      const tooLarge = error instanceof McpToolResultTooLarge;
      step.errorCode = tooLarge ? "result_too_large" : "tool_unavailable";
      result = JSON.stringify({
        isError: true,
        text: tooLarge
          ? "The tool result was too large. For a read, request a smaller page or narrower filters."
          : "Tool call failed or is no longer authorized. Do not claim it succeeded.",
      });
    }
    step.completedAt = new Date().toISOString();
    return JSON.stringify({ call, result, step, responseState });
  }
}

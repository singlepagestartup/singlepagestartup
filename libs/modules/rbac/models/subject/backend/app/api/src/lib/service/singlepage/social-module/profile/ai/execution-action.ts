import { randomUUID } from "node:crypto";
import { logger } from "@sps/backend-utils";
import {
  AI_EXECUTION_ACTION_MAX_STEPS,
  AI_EXECUTION_ACTION_VARIANT,
  AI_EXECUTION_ACTION_VERSION,
  type IAiExecutionActionPayload,
  type IAiExecutionActionStep,
} from "@sps/rbac/models/subject/sdk/model";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";
import { api as socialModuleChatsToActionsApi } from "@sps/social/relations/chats-to-actions/sdk/server";
import { api as socialModuleProfilesToActionsApi } from "@sps/social/relations/profiles-to-actions/sdk/server";
import { api as socialModuleThreadsToActionsApi } from "@sps/social/relations/threads-to-actions/sdk/server";
import type {
  TSocialProfileAiToolLoopEvent,
  TSocialProfileAiToolLoopStopReason,
} from "./tool-loop";

interface IAiExecutionActionPersistence {
  createAction: (payload: IAiExecutionActionPayload) => Promise<{ id: string }>;
  updateAction: (
    actionId: string,
    payload: IAiExecutionActionPayload,
  ) => Promise<unknown>;
  linkChat: (actionId: string, chatId: string) => Promise<unknown>;
  linkThread: (actionId: string, threadId: string) => Promise<unknown>;
  linkProfile: (actionId: string, profileId: string) => Promise<unknown>;
}

export interface IAiExecutionActionReporterProps {
  chatId: string;
  threadId: string;
  triggerMessageId: string;
  replySocialProfileId: string;
  secretKey: string;
  runId?: string;
  now?: () => Date;
  persistence?: IAiExecutionActionPersistence;
}

export interface IAiExecutionActionReporter {
  handle(event: TSocialProfileAiToolLoopEvent): Promise<void>;
}

function terminalStatus(reason: TSocialProfileAiToolLoopStopReason) {
  if (reason === "final_text") {
    return "completed" as const;
  }

  if (
    reason === "max_iterations" ||
    reason === "total_timeout" ||
    reason === "repeated_tool_call"
  ) {
    return "stopped" as const;
  }

  return "failed" as const;
}

function boundedText(value: string, fallback: string, maxLength = 256) {
  const normalized = value.trim() || fallback;

  return normalized.slice(0, maxLength);
}

export class AiExecutionActionReporter implements IAiExecutionActionReporter {
  private readonly props: IAiExecutionActionReporterProps;
  private readonly now: () => Date;
  private readonly persistence: IAiExecutionActionPersistence;
  private readonly runId: string;
  private actionId?: string;
  private creationAttempted = false;
  private payload: IAiExecutionActionPayload;
  private queue: Promise<void> = Promise.resolve();

  constructor(props: IAiExecutionActionReporterProps) {
    this.props = props;
    this.now = props.now || (() => new Date());
    this.runId = props.runId || randomUUID();
    this.persistence =
      props.persistence || this.createSdkPersistence(props.secretKey);
    this.payload = {
      version: AI_EXECUTION_ACTION_VERSION,
      runId: this.runId,
      triggerMessageId: props.triggerMessageId,
      replySocialProfileId: props.replySocialProfileId,
      status: "running",
      phase: "tool_requested",
      startedAt: this.now().toISOString(),
      steps: [],
    };
  }

  handle(event: TSocialProfileAiToolLoopEvent): Promise<void> {
    this.queue = this.queue
      .then(() => this.process(event))
      .catch((error) => {
        logger.error("RBAC AI execution action projection failed", {
          runId: this.runId,
          actionId: this.actionId,
          message:
            error instanceof Error
              ? error.message
              : "Unknown action persistence failure",
        });
      });

    return this.queue;
  }

  private async process(event: TSocialProfileAiToolLoopEvent) {
    if (event.type === "run_completed") {
      if (!this.actionId) {
        return;
      }

      this.payload = {
        ...this.payload,
        status: terminalStatus(event.stopReason),
        phase: "finalizing",
        ...(event.selectedModelId
          ? {
              selectedModelId: boundedText(
                event.selectedModelId,
                "unknown-model",
              ),
            }
          : {}),
        completedAt: this.now().toISOString(),
      };
      await this.persistence.updateAction(this.actionId, this.payload);
      return;
    }

    const stepId = boundedText(
      event.callId,
      `call-${this.payload.steps.length + 1}`,
    );
    const existingIndex = this.payload.steps.findIndex((step) => {
      return step.id === stepId;
    });

    if (
      existingIndex === -1 &&
      this.payload.steps.length >= AI_EXECUTION_ACTION_MAX_STEPS
    ) {
      return;
    }

    const occurredAt = this.now().toISOString();
    const existingStep = this.payload.steps[existingIndex];
    const toolName = boundedText(event.name, "unknown-tool");
    const label = boundedText(event.label, toolName);
    const serverId = event.serverId
      ? boundedText(event.serverId, "mcp")
      : undefined;
    let nextStep: IAiExecutionActionStep;

    if (event.type === "tool_requested") {
      nextStep = {
        id: stepId,
        kind: event.source,
        ...(serverId ? { serverId } : {}),
        toolName,
        label,
        status: "requested",
      };
    } else if (event.type === "tool_started") {
      nextStep = {
        ...(existingStep || {
          id: stepId,
          kind: event.source,
          toolName,
          label,
        }),
        ...(serverId ? { serverId } : {}),
        status: "running",
        startedAt: existingStep?.startedAt || occurredAt,
      };
    } else if (event.type === "tool_succeeded") {
      nextStep = {
        ...(existingStep || {
          id: stepId,
          kind: event.source,
          toolName,
          label,
        }),
        ...(serverId ? { serverId } : {}),
        status: "succeeded",
        startedAt: existingStep?.startedAt || occurredAt,
        completedAt: occurredAt,
        resultBytes: event.resultBytes,
      };
    } else {
      nextStep = {
        ...(existingStep || {
          id: stepId,
          kind: event.source,
          toolName,
          label,
        }),
        ...(serverId ? { serverId } : {}),
        status: "failed",
        startedAt: existingStep?.startedAt || occurredAt,
        completedAt: occurredAt,
        errorCode: event.reason,
      };
    }

    const steps = [...this.payload.steps];

    if (existingIndex === -1) {
      steps.push(nextStep);
    } else {
      steps[existingIndex] = nextStep;
    }

    this.payload = {
      ...this.payload,
      status: "running",
      phase:
        event.type === "tool_requested"
          ? "tool_requested"
          : event.type === "tool_started"
            ? "tool_running"
            : "tool_completed",
      selectedModelId: boundedText(event.selectedModelId, "unknown-model"),
      steps,
    };

    if (!this.actionId) {
      if (this.creationAttempted) {
        return;
      }

      this.creationAttempted = true;
      const action = await this.persistence.createAction(this.payload);
      this.actionId = action.id;
      await Promise.all([
        this.persistence.linkChat(action.id, this.props.chatId),
        this.persistence.linkThread(action.id, this.props.threadId),
        this.persistence.linkProfile(
          action.id,
          this.props.replySocialProfileId,
        ),
      ]);
      return;
    }

    await this.persistence.updateAction(this.actionId, this.payload);
  }

  private createSdkPersistence(
    secretKey: string,
  ): IAiExecutionActionPersistence {
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": secretKey,
      },
    };

    return {
      createAction: async (payload) => {
        return socialModuleActionApi.create({
          data: {
            variant: AI_EXECUTION_ACTION_VARIANT,
            payload,
          },
          options,
        });
      },
      updateAction: async (actionId, payload) => {
        return socialModuleActionApi.update({
          id: actionId,
          data: { payload },
          options,
        });
      },
      linkChat: async (actionId, chatId) => {
        return socialModuleChatsToActionsApi.create({
          data: { actionId, chatId },
          options,
        });
      },
      linkThread: async (actionId, threadId) => {
        return socialModuleThreadsToActionsApi.create({
          data: { actionId, threadId },
          options,
        });
      },
      linkProfile: async (actionId, profileId) => {
        return socialModuleProfilesToActionsApi.create({
          data: { actionId, profileId },
          options,
        });
      },
    };
  }
}

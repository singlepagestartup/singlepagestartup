"use client";

import type { ProfileSummary } from "../types";
import {
  AI_EXECUTION_ACTION_VARIANT,
  formatAiExecutionActionStepToolName,
  parseAiExecutionActionPayload,
  type IAiExecutionActionStep,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as ISocialModuleAction } from "@sps/social/models/action/sdk/model";
import { cn } from "@sps/shared-frontend-client-utils";
import { CollapsibleContent, CollapsibleTrigger } from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Database,
  LoaderCircle,
  Wrench,
} from "lucide-react";

interface AiExecutionActionRowProps {
  action: ISocialModuleAction;
  language: string;
  profile: ProfileSummary;
}

function formatTimelineDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function serverLabel(serverId?: string) {
  if (!serverId) {
    return "MCP";
  }

  if (serverId.toLowerCase() === "singlepagestartup") {
    return "SinglePageStartup MCP";
  }

  return `${serverId} MCP`;
}

function StepIcon(props: { step: IAiExecutionActionStep }) {
  if (props.step.status === "succeeded") {
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
  }

  if (props.step.status === "failed") {
    return <CircleAlert className="size-4 shrink-0 text-rose-500" />;
  }

  return (
    <LoaderCircle className="size-4 shrink-0 animate-spin text-blue-500" />
  );
}

function SourceIcon(props: { kind: IAiExecutionActionStep["kind"] }) {
  if (props.kind === "knowledge") {
    return <Database className="size-3.5" />;
  }

  if (props.kind === "skill") {
    return <Brain className="size-3.5" />;
  }

  return <Wrench className="size-3.5" />;
}

function runningTitle(step: IAiExecutionActionStep, isRussian: boolean) {
  if (step.kind === "mcp") {
    return isRussian
      ? `Использует ${serverLabel(step.serverId)}: ${step.label}`
      : `Using ${serverLabel(step.serverId)}: ${step.label}`;
  }

  if (step.kind === "knowledge") {
    return isRussian
      ? `Ищет в базе знаний: ${step.label}`
      : `Searching Knowledge: ${step.label}`;
  }

  return isRussian
    ? `Применяет навык: ${step.label}`
    : `Applying skill: ${step.label}`;
}

export function AiExecutionActionRow(props: AiExecutionActionRowProps) {
  const payload = parseAiExecutionActionPayload(props.action);
  const isRussian = props.language.toLowerCase().startsWith("ru");
  const createdAt = formatTimelineDate(props.action.createdAt);

  if (!payload) {
    return (
      <div
        data-module="rbac"
        data-model="subject"
        data-variant={AI_EXECUTION_ACTION_VARIANT}
        data-status="unavailable"
        className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
      >
        {isRussian
          ? "Статус выполнения инструмента недоступен."
          : "Tool execution status is unavailable."}
      </div>
    );
  }

  const currentStep =
    [...payload.steps].reverse().find((step) => {
      return step.status === "running" || step.status === "requested";
    }) || payload.steps.at(-1);
  const completedSteps = payload.steps.filter((step) => {
    return step.status === "succeeded";
  }).length;
  const isRunning = payload.status === "running";
  const title = isRunning
    ? currentStep
      ? runningTitle(currentStep, isRussian)
      : isRussian
        ? "Готовит инструменты"
        : "Preparing tools"
    : payload.status === "completed"
      ? isRussian
        ? `Завершил работу с инструментами · ${completedSteps}`
        : `Finished tool work · ${completedSteps}`
      : payload.status === "stopped"
        ? isRussian
          ? "Работа с инструментами остановлена"
          : "Tool work stopped"
        : isRussian
          ? "Не получилось завершить задачу"
          : "The task could not be completed";

  return (
    <Collapsible
      defaultOpen={isRunning}
      data-module="rbac"
      data-model="subject"
      data-id={props.action.id}
      data-run-id={payload.runId}
      data-variant={AI_EXECUTION_ACTION_VARIANT}
      data-status={payload.status}
      className={cn(
        "rounded-xl border border-border bg-card",
        isRunning && "bg-muted/50",
      )}
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isRunning
              ? "bg-primary/10 text-primary"
              : payload.status === "completed"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-rose-600",
          )}
        >
          {isRunning ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : payload.status === "completed" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <CircleAlert className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-xs font-medium text-foreground"
            aria-live="polite"
          >
            {title}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {props.profile.slug}
            {createdAt ? ` · ${createdAt}` : ""}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 border-t border-border px-3 py-2.5">
          {payload.steps.map((step) => {
            return (
              <div
                key={step.id}
                className="flex items-start gap-2 rounded-lg px-1 py-1.5 text-xs text-muted-foreground"
              >
                <StepIcon step={step} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <SourceIcon kind={step.kind} />
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                    {step.kind === "mcp" && step.serverId
                      ? `${serverLabel(step.serverId)} · `
                      : ""}
                    {formatAiExecutionActionStepToolName(step)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

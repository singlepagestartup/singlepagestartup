import type {
  ICrmWorkspaceParticipant,
  ICrmWorkspaceTaskDetail,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model";
import {
  settingsFormStyles,
  Button,
  RadioGroup,
  RadioGroupItem,
} from "@sps/shared-ui-shadcn";
import { ArrowUpRight, Bot, UserRound } from "lucide-react";
import Link from "next/link";
import { memo, useId, useRef, useState, type FormEvent } from "react";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeEmployeeHref } from "../../../ecommerce-module/store/paths";

type TAssignment = Extract<
  TCrmWorkspaceCommand,
  { kind: "assign" }
>["assignment"];

interface ITaskAssigneeProps {
  detail: ICrmWorkspaceTaskDetail;
  storeSlug: string;
  language: string;
  commandPending?: boolean;
  onAssign: (assignment: TAssignment) => Promise<unknown>;
}

interface IAssigneeOptionProps {
  participant: ICrmWorkspaceParticipant;
  current: boolean;
  pending: boolean;
  storeSlug: string;
  language: string;
}

const AssigneeOption = memo(function AssigneeOption({
  participant,
  current,
  pending,
  storeSlug,
  language,
}: IAssigneeOptionProps) {
  const ru = language === "ru";
  const controlId = useId();
  const labelId = `${controlId}-label`;
  const detailId = `${controlId}-detail`;
  const Icon = participant.kind === "ai" ? Bot : UserRound;
  const role =
    participant.kind === "ai"
      ? ru
        ? "ИИ-сотрудник"
        : "AI employee"
      : ru
        ? "Сотрудник магазина"
        : "Store employee";

  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-xl border border-border px-3"
      aria-busy={pending}
    >
      <RadioGroupItem
        id={controlId}
        value={participant.id}
        aria-labelledby={labelId}
        aria-describedby={detailId}
        className="peer size-5 shrink-0"
      />
      <label
        htmlFor={controlId}
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 peer-disabled:cursor-default"
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        <span className="grid min-w-0 gap-0.5">
          <span id={labelId} className="break-words text-sm font-medium">
            {participant.name}
          </span>
          <span id={detailId} className="text-xs text-muted-foreground">
            {role}
            {current && (ru ? " · Текущий" : " · Current")}
          </span>
        </span>
      </label>
      <Link
        aria-label={`${ru ? "Профиль" : "Profile"} · ${participant.name}`}
        href={storeEmployeeHref(language, storeSlug, participant.id)}
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
});

export function TaskAssignee({
  detail,
  storeSlug,
  language,
  commandPending,
  onAssign,
}: ITaskAssigneeProps) {
  const ru = language === "ru";
  const { task } = detail;
  const headingId = useId();
  const [draft, setDraft] = useState<{
    assigneeId: string;
    assignmentRevision: number;
  }>();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const operation = useRef<{
    assigneeId: string;
    revision: number;
    key: string;
  } | null>(null);
  const canAssign = detail.canManageTasks && task.status !== "closed";
  const candidates = detail.canManageTasks
    ? (detail.assignmentCandidates ?? [])
    : [];
  const currentCandidate = candidates.find(({ id }) => id === task.assigneeId);
  const orderedCandidates = currentCandidate
    ? [
        currentCandidate,
        ...candidates.filter(({ id }) => id !== currentCandidate.id),
      ]
    : candidates;
  const selected =
    (canAssign && draft?.assignmentRevision === task.assignmentRevision
      ? candidates.find(({ id }) => id === draft.assigneeId)
      : undefined) ?? currentCandidate;
  const expired = Boolean(
    task.assignmentExpiresAt &&
    new Date(task.assignmentExpiresAt) <= new Date(),
  );
  const canSubmit = Boolean(
    selected && (selected.id !== task.assigneeId || expired),
  );
  const disabled = !canAssign || pendingId !== null || Boolean(commandPending);
  const unassigned = detail.awaitingManager
    ? ru
      ? "Ожидает менеджера"
      : "Waiting for a manager"
    : ru
      ? "Без исполнителя"
      : "Unassigned";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || !canSubmit || !selected) return;
    if (
      operation.current?.assigneeId !== selected.id ||
      operation.current.revision !== task.revision
    ) {
      operation.current = {
        assigneeId: selected.id,
        revision: task.revision,
        key: crypto.randomUUID(),
      };
    }
    setPendingId(selected.id);
    setError("");
    try {
      await onAssign({
        storeId: task.storeId,
        taskId: task.id,
        expectedRevision: task.revision,
        operationKey: operation.current.key,
        assigneeId: selected.id,
      });
      operation.current = null;
      setDraft(undefined);
    } catch (failure) {
      if (hasStatus(failure, 409)) {
        setError(
          ru
            ? "Задача изменилась. Проверьте исполнителя и повторите."
            : "The task changed. Check the assignee and try again.",
        );
      } else {
        setError(
          failure instanceof Error
            ? failure.message
            : ru
              ? "Не удалось назначить исполнителя."
              : "Could not assign the task.",
        );
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`${settingsFormStyles.panel} grid gap-4`}
    >
      <h2 id={headingId} className={settingsFormStyles.title}>
        {ru ? "Исполнитель задачи" : "Task assignee"}
      </h2>
      {!task.assigneeId ? (
        <p className="text-sm text-muted-foreground">{unassigned}</p>
      ) : !currentCandidate ? (
        <Link
          href={storeEmployeeHref(language, storeSlug, task.assigneeId)}
          className="inline-flex w-fit max-w-full items-center gap-1.5 break-words text-sm underline underline-offset-4"
        >
          {task.assigneeName ??
            (ru ? "Профиль исполнителя" : "Assignee profile")}
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </Link>
      ) : null}
      {!!candidates.length && (
        <>
          {/* The SDK uses the selection from state. Keeping the radios outside the submit form avoids Radix's duplicate form inputs. */}
          <RadioGroup
            aria-labelledby={headingId}
            value={selected?.id ?? ""}
            disabled={disabled}
            onValueChange={(assigneeId) => {
              setDraft({
                assigneeId,
                assignmentRevision: task.assignmentRevision,
              });
              setError("");
            }}
          >
            {orderedCandidates.map((participant) => (
              <AssigneeOption
                key={participant.id}
                participant={participant}
                current={participant.id === task.assigneeId}
                pending={participant.id === pendingId}
                storeSlug={storeSlug}
                language={language}
              />
            ))}
          </RadioGroup>
          {canAssign && error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {canAssign && (
            <form onSubmit={submit} className="flex justify-end">
              <Button
                variant="primary"
                type="submit"
                className={`${settingsFormStyles.primary} w-fit`}
                disabled={!canSubmit || disabled}
              >
                {pendingId
                  ? ru
                    ? "Назначаем…"
                    : "Assigning…"
                  : ru
                    ? "Назначить"
                    : "Assign"}
              </Button>
            </form>
          )}
        </>
      )}
      {canAssign && !candidates.length && (
        <p className="text-sm text-muted-foreground">
          {detail.thread
            ? ru
              ? "В этой переписке нет доступных исполнителей со стороны магазина."
              : "No store participants in this conversation are available for assignment."
            : ru
              ? "Нет доступных исполнителей со стороны магазина."
              : "No store employees are available for assignment."}
        </p>
      )}
    </section>
  );
}

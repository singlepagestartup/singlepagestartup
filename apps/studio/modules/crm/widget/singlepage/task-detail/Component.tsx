import { Archive, ArrowUpRight, Package } from "lucide-react";
import { useId, useState } from "react";
import {
  Assignee,
  DueDate,
  secondaryClass,
  TaskStatus,
} from "../../../shared/workflow-ui";
import { timestampLabel } from "../../../shared/workflows";
import type { IComponentProps } from "./interface";
import { Component as SocialMessage } from "../../../../social/message";

const stageIndicators = {
  current: { label: "Текущий этап", color: "bg-primary" },
  visited: { label: "Задача была на этапе", color: "bg-primary/65" },
  unvisited: {
    label: "Задача не была на этапе",
    color: "bg-muted-foreground/20",
  },
  completed: {
    label: "Завершена на этом этапе",
    color: "bg-emerald-600",
  },
  closed: {
    label: "Закрыта на этом этапе",
    color: "bg-muted-foreground",
  },
};

function StageProgress({
  task,
  workflow,
}: Pick<IComponentProps, "task" | "workflow">) {
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const visited = new Set(task.history.map(({ stageId }) => stageId));
  const current = workflow.stages.find(({ id }) => id === task.stageId);
  const stages = workflow.stages
    .filter(
      ({ archived, id }) => !archived || visited.has(id) || id === task.stageId,
    )
    .map((stage, index) => {
      let state: keyof typeof stageIndicators = visited.has(stage.id)
        ? "visited"
        : "unvisited";
      if (stage.id === task.stageId) {
        state = "current";
        if (task.state === "completed" || task.state === "closed") {
          state = task.state;
        }
      }
      return {
        ...stage,
        state,
        position: index + 1,
        indicator: stageIndicators[state],
      };
    });
  const shown =
    stages.find(({ id }) => id === (hovered ?? focused ?? selected)) ??
    stages.find(({ id }) => id === current?.id);

  return (
    <div className="grid min-w-0 gap-1 border-t border-border/70 pt-3">
      {stages.length > 0 && (
        <ol
          aria-label="Этапы воронки"
          className="flex min-w-0 gap-1.5 overflow-x-auto px-0.5 py-0.5"
        >
          {stages.map((stage) => (
            <li className="min-w-6 flex-1" key={stage.id}>
              <button
                type="button"
                aria-label={`${stage.title} · ${stage.indicator.label}`}
                aria-current={stage.id === current?.id ? "step" : undefined}
                className="flex h-7 w-full items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                onFocus={() => setFocused(stage.id)}
                onBlur={() => setFocused(undefined)}
                onMouseEnter={() => setHovered(stage.id)}
                onMouseLeave={() => setHovered(undefined)}
                onClick={() => setSelected(stage.id)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setHovered(undefined);
                    setSelected(undefined);
                    setFocused(undefined);
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-full rounded-full ${stage.indicator.color}`}
                />
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        {shown ? (
          <>
            <span className="text-muted-foreground">
              Этап {shown.position} из {stages.length} ·
            </span>
            <span className="font-semibold">{shown.title}</span>
            {shown.state !== "current" && (
              <span className="text-xs text-muted-foreground">
                {shown.indicator.label}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">Этап недоступен</span>
        )}
        {shown?.archived && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Archive aria-hidden="true" className="size-3.5" /> Архивный этап
          </span>
        )}
      </p>
    </div>
  );
}

function TaskAssignee({
  task,
  people,
  onAssign,
}: Pick<IComponentProps, "task" | "people" | "onAssign">) {
  const headingId = useId();
  const [draft, setDraft] = useState<{ id: string; revision: number }>();
  const current = people.find(({ id }) => id === task.assignee);
  const canAssign =
    Boolean(onAssign) && task.state !== "completed" && task.state !== "closed";
  const candidates = canAssign
    ? (task.assignmentCandidateIds ?? []).flatMap((id) => {
        const person = people.find((person) => person.id === id);
        return person ? [person] : [];
      })
    : [];
  const currentListed = candidates.some(({ id }) => id === current?.id);
  const orderedCandidates =
    current && currentListed
      ? [current, ...candidates.filter(({ id }) => id !== current.id)]
      : candidates;
  const selected =
    draft?.revision === task.revision &&
    candidates.some(({ id }) => id === draft.id)
      ? draft.id
      : currentListed
        ? task.assignee
        : "";
  const href = (id: string) =>
    `/ru/ecommerce/stores/${encodeURIComponent(task.shopId)}/employees/${encodeURIComponent(id)}`;

  return (
    <section
      aria-labelledby={headingId}
      className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4"
    >
      <h3 id={headingId} className="text-sm font-semibold">
        Исполнитель задачи
      </h3>
      {!currentListed &&
        (current ? (
          <a
            href={href(current.id)}
            className="inline-flex w-fit max-w-full items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
          >
            <Assignee person={current} />
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          </a>
        ) : (
          <Assignee />
        ))}
      {!!candidates.length && (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (selected && selected !== task.assignee) onAssign?.(selected);
            setDraft(undefined);
          }}
        >
          <div
            role="radiogroup"
            aria-labelledby={headingId}
            className="grid gap-2"
          >
            {orderedCandidates.map((person) => {
              const controlId = `${headingId}-${person.id}`;
              return (
                <div
                  key={person.id}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3"
                >
                  <input
                    type="radio"
                    name={headingId}
                    value={person.id}
                    checked={selected === person.id}
                    onChange={() =>
                      setDraft({ id: person.id, revision: task.revision })
                    }
                    id={controlId}
                    aria-label={person.name}
                    className="size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring"
                  />
                  <label
                    htmlFor={controlId}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-1.5 py-2"
                  >
                    <Assignee person={person} />
                    {person.id === task.assignee && (
                      <span className="text-xs text-muted-foreground">
                        Текущий
                      </span>
                    )}
                  </label>
                  <a
                    aria-label={`Профиль · ${person.name}`}
                    href={href(person.id)}
                    className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                </div>
              );
            })}
          </div>
          <button
            type="submit"
            className={`${secondaryClass} w-fit`}
            disabled={!selected || selected === task.assignee}
          >
            Назначить
          </button>
        </form>
      )}
      {canAssign && !candidates.length && (
        <p className="text-sm text-muted-foreground">
          {task.thread
            ? "В этой переписке нет доступных исполнителей со стороны магазина."
            : "Нет доступных исполнителей со стороны магазина."}
        </p>
      )}
    </section>
  );
}

export function Component({
  task,
  workflow,
  people,
  audience = "manager",
  canReadConversation = true,
  onAssign,
}: IComponentProps) {
  const isManager = audience === "manager";

  return (
    <article
      data-ds-block="crm.widget.task-detail"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="widget"
      data-variant="task-detail"
      className="@container grid min-w-0 gap-4 break-words bg-background text-foreground"
    >
      <header className="grid min-w-0 gap-4 rounded-2xl border border-l-4 border-border border-l-primary bg-card p-4 sm:p-5">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {workflow.title}
            </p>
            <TaskStatus state={task.state} />
          </div>
          <h2 className="font-primary text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {task.label}
          </h2>
        </div>
        {isManager && <StageProgress task={task} workflow={workflow} />}
      </header>
      <div
        className={`grid min-w-0 items-start gap-4 ${isManager ? "@min-[46rem]:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.65fr)]" : ""}`}
      >
        <div className="grid min-w-0 gap-3">
          {(isManager || task.dueAt || task.waitingFor) && (
            <dl className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              {isManager && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">Клиент</dt>
                  <dd className="font-medium">{task.customer}</dd>
                </div>
              )}
              {task.dueAt && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">Срок</dt>
                  <dd>
                    <DueDate value={task.dueAt} />
                  </dd>
                </div>
              )}
              {task.waitingFor && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="text-muted-foreground">Ожидаем</dt>
                  <dd>{task.waitingFor}</dd>
                </div>
              )}
            </dl>
          )}
          {isManager && (
            <TaskAssignee task={task} people={people} onAssign={onAssign} />
          )}
          {task.order && (
            <section className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Package aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">Заказ</h3>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    #{task.order.id} · {task.order.title}
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs leading-4 font-medium text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-current"
                />
                {task.order.state}
              </span>
            </section>
          )}
          {!isManager && task.terms && (
            <section className="grid gap-2 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Условия</h3>
              <p className="text-sm leading-6">{task.terms}</p>
            </section>
          )}
          {task.result && (
            <section className="grid gap-2 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Результат</h3>
              <p className="text-sm font-medium">
                {task.result.title} · {task.result.version}
              </p>
              <p className="text-sm text-muted-foreground">
                {task.result.status}
              </p>
            </section>
          )}
        </div>
        {isManager && (
          <section className="grid min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">
              Переписка
            </h3>
            {!canReadConversation ? (
              <p className="p-4 text-sm text-muted-foreground">
                Переписка недоступна.
              </p>
            ) : task.thread ? (
              <>
                <div
                  role="log"
                  aria-label="Сообщения"
                  className="flex min-h-60 min-w-0 flex-col justify-end p-4"
                >
                  <SocialMessage
                    variant="bubble-default"
                    author={task.customer}
                    role="Клиент"
                    body={task.thread.latestMessage}
                    display="timeline"
                    side="incoming"
                    time={timestampLabel(task.updatedAt)}
                    attachments={[]}
                  />
                </div>
                <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                  Отвечать может текущий исполнитель.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                К этой задаче не привязана переписка.
              </p>
            )}
          </section>
        )}
      </div>
    </article>
  );
}

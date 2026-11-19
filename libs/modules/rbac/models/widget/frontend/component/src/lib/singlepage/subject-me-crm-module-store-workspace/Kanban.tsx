import { Archive, Inbox } from "lucide-react";
import { memo, useState } from "react";
import {
  Assignee,
  DueDate,
  MoveButton,
  TaskLink,
  TaskStatus,
  type TaskActions,
} from "./primitives";
import { type WorkflowPerson, type WorkflowTask } from "./view-model";
import type { ITaskCollectionProps } from "./view-model";

const taskDragType = "application/x-sps-crm-task";

interface TaskCardProps extends TaskActions {
  task: WorkflowTask;
  person?: WorkflowPerson;
  pending: boolean;
}

const TaskCard = memo(function TaskCard({
  task,
  person,
  pending,
  onOpenTask,
  onRequestMove,
}: TaskCardProps) {
  const { id, label, customer, state, waitingFor, dueAt } = task;

  return (
    <article
      aria-busy={pending}
      className={`rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-xs ${onRequestMove && task.canMove && !pending ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={Boolean(onRequestMove) && task.canMove && !pending}
      onDragStart={(event) => {
        event.dataTransfer.setData(taskDragType, id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {id}
        </span>
        <TaskStatus state={state} />
      </div>
      <TaskLink href={task.href} taskId={id} onOpenTask={onOpenTask}>
        {label}
      </TaskLink>
      <p className="mt-1 break-words text-sm text-muted-foreground">
        {customer}
      </p>
      {waitingFor && (
        <p className="mt-3 break-words rounded-md border-l-2 border-amber-500 bg-amber-50 px-2.5 py-1.5 text-xs leading-5 text-amber-950">
          {waitingFor}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="grid min-w-0 gap-1.5">
          <Assignee person={person} />
          <span className="text-xs">
            <DueDate value={dueAt} />
          </span>
        </div>
        <MoveButton
          taskId={id}
          taskLabel={label}
          pending={pending}
          onRequestMove={onRequestMove}
        />
      </div>
      {pending && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Проверяем переход…
        </p>
      )}
    </article>
  );
});

const stageMarkers = [
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
];

export function Kanban({
  stages,
  tasks,
  people,
  pendingIds,
  onOpenTask,
  onRequestMove,
}: ITaskCollectionProps) {
  const [dropStage, setDropStage] = useState<string>();

  return (
    <div
      aria-label="Этапы воронки"
      role="region"
      tabIndex={0}
      className="grid min-w-0 content-start gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex sm:overflow-x-auto sm:pb-2"
      onDragEnd={() => setDropStage(undefined)}
    >
      {stages.map((stage, index) => {
        const stageTasks = tasks.filter((task) => task.stageId === stage.id);

        return (
          <section
            key={stage.id}
            aria-label={stage.title}
            data-stage-id={stage.id}
            className={`min-w-0 rounded-xl border p-2.5 sm:min-h-72 sm:flex-[1_0_15.5rem] ${dropStage === stage.id ? "border-ring bg-accent" : "border-border/70 bg-background/65"}`}
            onDragOver={(event) => {
              if (
                !onRequestMove ||
                stage.archived ||
                !event.dataTransfer.types.includes(taskDragType)
              )
                return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropStage(stage.id);
            }}
            onDragLeave={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
              )
                return;
              setDropStage(undefined);
            }}
            onDrop={(event) => {
              if (!onRequestMove || stage.archived) return;
              const taskId = event.dataTransfer.getData(taskDragType);
              if (!taskId) return;
              event.preventDefault();
              setDropStage(undefined);
              const task = tasks.find(({ id }) => id === taskId);
              if (!task || task.stageId === stage.id || pendingIds?.has(taskId))
                return;
              onRequestMove({ taskId, toStageId: stage.id });
            }}
          >
            <header className="mb-2.5 flex min-h-10 items-center gap-2 px-1">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${stageMarkers[index % stageMarkers.length]}`}
              />
              <h3 className="min-w-0 break-words text-sm font-semibold">
                {stage.title}
              </h3>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {stageTasks.length}
              </span>
              {stage.archived && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Archive aria-hidden="true" className="size-3.5" /> Архив
                </span>
              )}
            </header>
            {stageTasks.length ? (
              <div className="grid gap-2.5">
                {stageTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    person={people.find(
                      (person) => person.id === task.assignee,
                    )}
                    pending={Boolean(pendingIds?.has(task.id))}
                    onOpenTask={onOpenTask}
                    onRequestMove={onRequestMove}
                  />
                ))}
              </div>
            ) : (
              <p className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
                <Inbox aria-hidden="true" className="size-4 shrink-0" /> Нет
                задач
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

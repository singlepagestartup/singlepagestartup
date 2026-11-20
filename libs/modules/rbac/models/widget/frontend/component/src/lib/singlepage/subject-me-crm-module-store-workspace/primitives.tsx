import {
  Bot,
  CalendarDays,
  CircleCheck,
  CircleMinus,
  Clock3,
  Dot,
  MoveRight,
  UserPlus,
} from "lucide-react";
import {
  taskStateLabels,
  timestampLabel,
  type RequestMove,
  type TaskState,
  type WorkflowPerson,
} from "./view-model";

export const actionClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";
export const primaryClass = `${actionClass} border-transparent bg-primary text-primary-foreground hover:bg-primary/90`;
export const secondaryClass = `${actionClass} border-border bg-card text-card-foreground hover:bg-muted`;
export const fieldClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring";
export const iconButtonClass = `${secondaryClass} aspect-square w-10 shrink-0 p-0`;

const statuses = {
  active: { Icon: Dot, className: "bg-sky-100 text-sky-900" },
  waiting: { Icon: Clock3, className: "bg-amber-100 text-amber-950" },
  completed: {
    Icon: CircleCheck,
    className: "bg-emerald-100 text-emerald-950",
  },
  closed: { Icon: CircleMinus, className: "bg-muted text-muted-foreground" },
};

export function TaskStatus({ state }: { state: TaskState }) {
  const { Icon, className } = statuses[state];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs leading-4 font-medium ${className}`}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {taskStateLabels[state]}
    </span>
  );
}

export function Assignee({ person }: { person?: WorkflowPerson }) {
  if (!person)
    return (
      <span className="text-sm text-muted-foreground">Без исполнителя</span>
    );

  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${person.kind === "agent" ? "bg-violet-100 text-violet-900" : "bg-slate-100 text-slate-800"}`}
      >
        {person.kind === "agent" ? (
          <Bot className="size-3.5" />
        ) : (
          person.initials
        )}
      </span>
      <span className="min-w-0 break-words">{person.name}</span>
    </span>
  );
}

export function DueDate({ value }: { value?: string }) {
  if (!value) return <span className="text-muted-foreground">Без срока</span>;

  return (
    <time
      className="inline-flex items-center gap-1.5 text-muted-foreground"
      dateTime={value}
    >
      <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
      {timestampLabel(value)}
    </time>
  );
}

export interface TaskActions {
  onOpenTask?: (id: string, element: HTMLElement) => void;
  onRequestMove?: (move: RequestMove, element?: HTMLElement) => void;
}

export function AssignButton({
  taskId,
  taskLabel,
  onOpenTask,
}: {
  taskId: string;
  taskLabel: string;
  onOpenTask?: TaskActions["onOpenTask"];
}) {
  if (!onOpenTask) return null;

  return (
    <button
      type="button"
      aria-label={`Назначить исполнителя для задачи «${taskLabel}»`}
      className={`${secondaryClass} w-fit px-2.5 py-1 text-xs`}
      onClick={(event) => onOpenTask(taskId, event.currentTarget)}
    >
      <UserPlus aria-hidden="true" className="size-3.5" />
      Назначить
    </button>
  );
}

interface MoveButtonProps extends Pick<TaskActions, "onRequestMove"> {
  taskId: string;
  taskLabel: string;
  pending?: boolean;
}

export function MoveButton({
  taskId,
  taskLabel,
  pending,
  onRequestMove,
}: MoveButtonProps) {
  if (!onRequestMove) return null;

  return (
    <button
      aria-label={
        pending
          ? `Переход проверяется · ${taskLabel}`
          : `Переместить в… · ${taskLabel}`
      }
      className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-card text-card-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60 sm:size-9"
      onClick={(event) => onRequestMove({ taskId }, event.currentTarget)}
      disabled={pending}
      title={pending ? "Переход проверяется" : "Переместить в…"}
      type="button"
    >
      {pending ? (
        <Clock3
          aria-hidden="true"
          className="size-4 animate-pulse motion-reduce:animate-none"
        />
      ) : (
        <MoveRight aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}

export function TaskLink({
  href,
  taskId,
  onOpenTask,
  children,
}: {
  href: string;
  taskId: string;
  onOpenTask?: TaskActions["onOpenTask"];
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      data-task-link={taskId}
      onClick={(event) => {
        if (
          !onOpenTask ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        event.preventDefault();
        onOpenTask(taskId, event.currentTarget);
      }}
      className="break-words font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </a>
  );
}

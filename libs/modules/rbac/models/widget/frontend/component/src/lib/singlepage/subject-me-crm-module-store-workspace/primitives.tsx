import { Component as SocialProfileAvatar } from "@sps/social/models/profile/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils/cn";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import {
  Bot,
  CalendarDays,
  CircleCheck,
  CircleMinus,
  Clock3,
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

export const storeList = {
  panel: `${settingsFormStyles.panel} grid gap-5`,
  heading: "flex flex-wrap items-center justify-between gap-3",
  title: "text-2xl font-semibold tracking-tight",
  row: "group min-w-0 rounded-2xl border border-border bg-card text-card-foreground transition-[border-color,box-shadow] duration-150 hover:border-foreground/30 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
  arrow:
    "size-4 shrink-0 text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground",
};

export const iconButtonClass = cn(
  settingsFormStyles.secondary,
  "size-11 shrink-0 p-0",
);

const statuses = {
  active: { Icon: null, className: "bg-sky-100 text-sky-900" },
  waiting: { Icon: Clock3, className: "bg-amber-100 text-amber-950" },
  completed: {
    Icon: CircleCheck,
    className: "bg-emerald-100 text-emerald-950",
  },
  closed: { Icon: CircleMinus, className: "bg-muted text-muted-foreground" },
};

const englishTaskStateLabels: Record<TaskState, string> = {
  active: "In progress",
  waiting: "Waiting",
  completed: "Completed",
  closed: "Closed without a result",
};

export function TaskStatus({
  state,
  language = "ru",
}: {
  state: TaskState;
  language?: string;
}) {
  const { Icon, className } = statuses[state];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs leading-4 font-medium ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      {language === "ru"
        ? taskStateLabels[state]
        : englishTaskStateLabels[state]}
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
      {person.profile?.avatar ? (
        <SocialProfileAvatar
          variant="chat-profile-avatar"
          isServer={false}
          dataSource="props"
          data={person.profile}
          file={person.profile.avatar}
          language={person.language}
          className="size-6"
        />
      ) : (
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
      )}
      {person.href ? (
        <a
          href={person.href}
          title={person.name}
          className="relative z-10 min-w-0 truncate underline underline-offset-4"
        >
          {person.name}
        </a>
      ) : (
        <span title={person.name} className="min-w-0 truncate">
          {person.name}
        </span>
      )}
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
  onRequestMove?: (move: RequestMove, element?: HTMLElement) => void;
}

export function AssignButton({
  href,
  taskLabel,
}: {
  href: string;
  taskLabel: string;
}) {
  return (
    <a
      href={href}
      aria-label={`Назначить исполнителя для задачи «${taskLabel}»`}
      className={`${secondaryClass} relative z-10 w-fit px-2.5 py-1 text-xs`}
    >
      <UserPlus aria-hidden="true" className="size-3.5" />
      Назначить
    </a>
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
      className="relative z-10 grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-card text-card-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
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
  children,
}: {
  href: string;
  taskId: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      data-task-link={taskId}
      draggable={false}
      className="break-words font-semibold text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
    >
      {children}
    </a>
  );
}

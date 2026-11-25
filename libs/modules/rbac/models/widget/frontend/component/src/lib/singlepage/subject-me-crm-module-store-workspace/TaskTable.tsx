import { Archive, ChevronRight } from "lucide-react";
import { memo } from "react";
import {
  Assignee,
  AssignButton,
  DueDate,
  MoveButton,
  storeList,
  TaskLink,
  TaskStatus,
  type TaskActions,
} from "./primitives";
import {
  timestampLabel,
  type ITaskCollectionProps,
  type WorkflowPerson,
  type WorkflowStage,
  type WorkflowTask,
} from "./view-model";

const taskColumns =
  "grid grid-cols-2 gap-x-4 gap-y-3 @5xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_4rem] @5xl:items-center";

const columnHeadings = [
  "Задача",
  "Этап",
  "Исполнитель",
  "Состояние",
  "Срок",
  "Заказ",
  "Изменено",
];

function FieldLabel({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="mb-1 block text-xs font-medium text-muted-foreground @5xl:hidden"
    >
      {children}
    </span>
  );
}

interface TaskRowProps extends TaskActions {
  task: WorkflowTask;
  person?: WorkflowPerson;
  stage?: WorkflowStage;
  pending: boolean;
  canAssign: boolean;
}

const TaskRow = memo(function TaskRow({
  task,
  person,
  stage,
  pending,
  canAssign,
  onRequestMove,
}: TaskRowProps) {
  return (
    <tr
      role="row"
      aria-busy={pending}
      className={`${storeList.row} ${taskColumns} relative isolate p-4 [&>td]:min-w-0`}
    >
      <th
        scope="row"
        role="rowheader"
        className="col-span-2 min-w-0 pr-8 text-left @5xl:col-span-1 @5xl:pr-0"
      >
        <span className="mb-1 block text-xs font-medium tabular-nums text-muted-foreground">
          {task.reportId}
        </span>
        <TaskLink href={task.href} taskId={task.id}>
          {task.label}
        </TaskLink>
        <span className="mt-1 block wrap-anywhere text-xs font-normal text-muted-foreground">
          {task.customer}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`${storeList.arrow} pointer-events-none absolute top-4 right-4 @5xl:top-1/2 @5xl:-translate-y-1/2`}
        />
      </th>
      <td role="cell" className="wrap-anywhere">
        <FieldLabel>Этап</FieldLabel>
        {stage?.title ?? "Этап недоступен"}
        {stage?.archived && (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Archive aria-hidden="true" className="size-3.5" /> Архив
          </span>
        )}
      </td>
      <td role="cell">
        <FieldLabel>Исполнитель</FieldLabel>
        <div className="grid min-w-0 gap-1.5 wrap-anywhere">
          <Assignee person={person} />
          {canAssign &&
            !task.assignee &&
            task.state !== "closed" &&
            task.state !== "completed" && (
              <AssignButton href={task.href} taskLabel={task.label} />
            )}
        </div>
      </td>
      <td role="cell">
        <FieldLabel>Состояние</FieldLabel>
        <TaskStatus state={task.state} />
        {task.waitingFor && (
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {task.waitingFor}
          </p>
        )}
        {pending && (
          <p role="status" className="mt-1 text-xs text-muted-foreground">
            Проверяем переход…
          </p>
        )}
      </td>
      <td role="cell" className="text-xs">
        <FieldLabel>Срок</FieldLabel>
        <DueDate value={task.dueAt} />
      </td>
      <td role="cell" className="wrap-anywhere text-xs tabular-nums">
        <FieldLabel>Заказ</FieldLabel>
        {task.order?.id ?? "—"}
      </td>
      <td role="cell" className="text-xs text-muted-foreground">
        <FieldLabel>Изменено</FieldLabel>
        <time dateTime={task.updatedAt}>{timestampLabel(task.updatedAt)}</time>
      </td>
      <td
        role="cell"
        className="col-span-2 flex items-center justify-end empty:hidden @5xl:col-span-1 @5xl:pr-6 @5xl:empty:flex"
      >
        <MoveButton
          taskId={task.id}
          taskLabel={task.label}
          pending={pending}
          onRequestMove={task.canMove ? onRequestMove : undefined}
        />
      </td>
    </tr>
  );
});

export function TaskTable({
  stages,
  tasks,
  people,
  pendingIds,
  canAssign,
  onRequestMove,
}: ITaskCollectionProps) {
  return (
    <div
      className="@container min-w-0"
      role="region"
      aria-label="Таблица задач"
    >
      <table role="table" className="grid w-full gap-2 text-left text-sm">
        <caption className="sr-only">Задачи выбранной воронки</caption>
        <thead role="rowgroup" className="sr-only @5xl:not-sr-only">
          <tr
            role="row"
            className={`${taskColumns} px-4 text-xs text-muted-foreground [&>th]:font-medium`}
          >
            {columnHeadings.map((heading) => (
              <th key={heading} role="columnheader" scope="col">
                {heading}
              </th>
            ))}
            <th role="columnheader" scope="col">
              <span className="sr-only">Действия</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="grid gap-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              stage={stages.find((stage) => stage.id === task.stageId)}
              person={people.find((person) => person.id === task.assignee)}
              pending={Boolean(pendingIds?.has(task.id))}
              canAssign={canAssign}
              onRequestMove={onRequestMove}
            />
          ))}
          {!tasks.length && (
            <tr role="row">
              <td
                role="cell"
                className="block rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground"
                colSpan={8}
              >
                Нет задач по выбранным фильтрам.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

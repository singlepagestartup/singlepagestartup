import { Archive } from "lucide-react";
import { memo } from "react";
import {
  Assignee,
  AssignButton,
  DueDate,
  MoveButton,
  TaskLink,
  TaskStatus,
  type TaskActions,
} from "./primitives";
import {
  timestampLabel,
  type WorkflowPerson,
  type WorkflowStage,
  type WorkflowTask,
} from "./view-model";
import type { ITaskCollectionProps } from "./view-model";

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
  onOpenTask,
  onRequestMove,
}: TaskRowProps) {
  return (
    <tr
      aria-busy={pending}
      className="border-t border-border align-top hover:bg-muted/50 [&>td]:px-3.5 [&>td]:py-3.5"
    >
      <td className="w-[24%] min-w-48">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              {task.reportId}
            </div>
            <TaskLink href={task.href} taskId={task.id} onOpenTask={onOpenTask}>
              {task.label}
            </TaskLink>
            <p className="mt-1 text-xs text-muted-foreground">
              {task.customer}
            </p>
          </div>
          {onRequestMove && (
            <div className="lg:hidden">
              <MoveButton
                taskId={task.id}
                taskLabel={task.label}
                pending={pending}
                onRequestMove={task.canMove ? onRequestMove : undefined}
              />
            </div>
          )}
        </div>
      </td>
      <td className="min-w-32">
        {stage?.title ?? "Этап недоступен"}
        {stage?.archived && (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Archive aria-hidden="true" className="size-3.5" /> Архив
          </span>
        )}
      </td>
      <td className="min-w-36">
        <div className="grid gap-1.5">
          <Assignee person={person} />
          {canAssign &&
            !task.assignee &&
            task.state !== "closed" &&
            task.state !== "completed" && (
              <AssignButton
                taskId={task.id}
                taskLabel={task.label}
                onOpenTask={onOpenTask}
              />
            )}
        </div>
      </td>
      <td className="min-w-36">
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
      <td className="min-w-32 text-xs">
        <DueDate value={task.dueAt} />
      </td>
      <td>
        <span className="whitespace-nowrap">{task.order?.id ?? "—"}</span>
      </td>
      <td className="min-w-28 text-xs text-muted-foreground">
        <time dateTime={task.updatedAt}>{timestampLabel(task.updatedAt)}</time>
      </td>
      {onRequestMove && (
        <td className="hidden lg:table-cell">
          <MoveButton
            taskId={task.id}
            taskLabel={task.label}
            pending={pending}
            onRequestMove={task.canMove ? onRequestMove : undefined}
          />
        </td>
      )}
    </tr>
  );
});

export function TaskTable({
  stages,
  tasks,
  people,
  pendingIds,
  canAssign,
  onOpenTask,
  onRequestMove,
}: ITaskCollectionProps) {
  return (
    <div
      aria-label="Таблица задач"
      className="min-w-0 overflow-x-auto rounded-xl border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      role="region"
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Задачи выбранной воронки</caption>
        <thead className="bg-muted/70 text-xs text-muted-foreground [&_th]:px-3.5 [&_th]:py-3">
          <tr>
            <th scope="col">Задача</th>
            <th scope="col">Этап</th>
            <th scope="col">Исполнитель</th>
            <th scope="col">Состояние</th>
            <th scope="col">Срок</th>
            <th scope="col">Заказ</th>
            <th scope="col">Изменено</th>
            {onRequestMove && (
              <th scope="col" className="hidden lg:table-cell">
                <span className="sr-only">Действия</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              stage={stages.find((stage) => stage.id === task.stageId)}
              person={people.find((person) => person.id === task.assignee)}
              pending={Boolean(pendingIds?.has(task.id))}
              canAssign={canAssign}
              onOpenTask={onOpenTask}
              onRequestMove={onRequestMove}
            />
          ))}
          {!tasks.length && (
            <tr>
              <td
                className="p-8 text-center text-muted-foreground"
                colSpan={onRequestMove ? 8 : 7}
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

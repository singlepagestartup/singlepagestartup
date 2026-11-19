import type {
  IFunnelStage,
  TEvidenceKind,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceTask } from "@sps/rbac/models/subject/sdk/model";
import type { TaskActions } from "./primitives";

export type TaskState = "active" | "waiting" | "completed" | "closed";

export interface RequestMove {
  taskId: string;
  toStageId?: string;
}

export interface WorkflowPerson {
  id: string;
  name: string;
  initials: string;
  kind: "human" | "agent";
}

export interface WorkflowStage {
  id: string;
  title: string;
  archived?: boolean;
}

export interface WorkflowTask {
  id: string;
  reportId: string;
  href: string;
  stageId: string;
  label: string;
  customer: string;
  assignee?: string;
  state: TaskState;
  waitingFor?: string;
  dueAt?: string;
  updatedAt: string;
  order?: { id: string };
  canMove: boolean;
}

export interface ITaskCollectionProps extends TaskActions {
  stages: WorkflowStage[];
  tasks: WorkflowTask[];
  people: WorkflowPerson[];
  pendingIds?: ReadonlySet<string>;
}

export const taskStateLabels: Record<TaskState, string> = {
  active: "В работе",
  waiting: "Ожидание",
  completed: "Выполнено",
  closed: "Закрыто без результата",
};

export const evidenceLabels: Record<TEvidenceKind, string> = {
  manual: "Запись менеджера",
  message: "Сообщение клиента",
  "model-result": "Результат исполнителя",
  "result-accepted": "Клиент принял результат",
  payment: "Платёж подтверждён",
  delivery: "Доставка подтверждена",
  "file-access": "Доступ к файлу открыт",
};

export function timestampLabel(value: string, withYear = false) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function canUseManualActions(stage?: IFunnelStage) {
  return !stage?.waiting || stage.waiting.expectedEvent === "message";
}

export function manualActions(stage?: IFunnelStage) {
  if (!stage || !canUseManualActions(stage)) return [];
  return stage.actions.filter(
    (action) =>
      action.nextStageId &&
      action.nextStageId !== stage.id &&
      action.actors.includes("manager") &&
      action.evidence.includes("manual"),
  );
}

export function taskView(
  task: ICrmWorkspaceTask,
  stages: IFunnelStage[],
  href: string,
): WorkflowTask {
  const stage = stages.find((stage) => stage.id === task.stageId);
  const state = task.outcome === "completed" ? "completed" : task.status;
  return {
    id: task.id,
    reportId: task.id.slice(0, 8),
    href,
    stageId: task.stageId,
    label: task.label,
    customer: task.customerName,
    assignee: task.assigneeId ?? undefined,
    state,
    waitingFor: task.expectedEvent
      ? evidenceLabels[task.expectedEvent]
      : undefined,
    dueAt: task.deadlineAt ?? undefined,
    updatedAt: task.updatedAt,
    order: task.orderId ? { id: task.orderId } : undefined,
    canMove: task.status !== "closed" && manualActions(stage).length > 0,
  };
}

export function taskHref(language: string, slug: string, id: string) {
  return `/${language}/ecommerce/stores/${encodeURIComponent(slug)}/crm/tasks/${encodeURIComponent(id)}`;
}

export function workspaceHref(language: string, slug?: string) {
  return slug
    ? `/${language}/ecommerce/stores/${encodeURIComponent(slug)}/crm`
    : `/${language}/crm/workspace`;
}

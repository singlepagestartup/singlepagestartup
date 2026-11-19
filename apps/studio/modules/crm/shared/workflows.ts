export type TaskState = "active" | "waiting" | "completed" | "closed";
export type WorkflowOperation =
  "reply" | "request-revision" | "checkout" | "handoff";
export type WorkflowEvent =
  | "none"
  | "customer-response"
  | "preview-accepted"
  | "payment-confirmed"
  | "delivery-confirmed"
  | "run-completed";

export interface WorkflowExchangeRate {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string;
  source: string;
  observedAt: string;
}

export type WorkflowResultPricing =
  | { kind: "offer" }
  | {
      kind: "confirmed-cost";
      multiplier: string;
      conversions: WorkflowExchangeRate[];
    };

export interface WorkflowStage {
  id: string;
  title: string;
  instruction: string;
  output?: "chat" | "pdf" | "image";
  evidence: string;
  missingData: string;
  waitFor: WorkflowEvent;
  waitHours: number;
  reminders: string;
  silenceOutcome: "" | "completed" | "closed";
  operations: WorkflowOperation[];
  assignee: string;
  payer: string;
  settlementEvent: WorkflowEvent;
  settlementInstruction?: string;
  resultPricing?: WorkflowResultPricing;
  archived?: boolean;
}

export interface WorkflowDraft {
  id: string;
  shopId: string;
  title: string;
  applicability: string;
  goal: string;
  stages: WorkflowStage[];
}

export interface WorkflowRelease extends WorkflowDraft {
  version: number;
  publishedAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  stageId: string;
  actor: string;
  at: string;
  reason: string;
  evidence?: string;
}

export interface TaskAssignment {
  id: string;
  assignee: string;
  at: string;
  reason: string;
}

export interface TaskCost {
  id: string;
  at: string;
  title: string;
  status: string;
  amount: string;
  transfer?: string;
}

export interface WorkflowTask {
  id: string;
  shopId: string;
  workflowId: string;
  version: number;
  stageId: string;
  revision: number;
  label: string;
  customer: string;
  assignee: string;
  state: TaskState;
  waitingFor?: string;
  dueAt?: string;
  updatedAt: string;
  history: TaskHistoryEntry[];
  assignments: TaskAssignment[];
  thread?: { id: string; title: string; latestMessage: string };
  order?: { id: string; title: string; state: string };
  costs: TaskCost[];
  terms?: string;
  result?: { version: string; status: string; title: string };
}

export interface WorkflowPerson {
  id: string;
  name: string;
  initials: string;
  kind: "human" | "agent";
}

export interface WorkflowFixture {
  shops: { id: string; title: string }[];
  releases: WorkflowRelease[];
  tasks: WorkflowTask[];
  people: WorkflowPerson[];
  payers: { id: string; title: string }[];
}

export interface RequestMove {
  taskId: string;
  toStageId?: string;
}

export const taskStateLabels: Record<TaskState, string> = {
  active: "В работе",
  waiting: "Ожидание",
  completed: "Выполнено",
  closed: "Закрыто без результата",
};

export const workflowOperationLabels: Record<WorkflowOperation, string> = {
  reply: "Ответить в треде",
  "request-revision": "Запросить правку",
  checkout: "Предложить оплату",
  handoff: "Передать исполнителю",
};

export const workflowEventLabels: Record<WorkflowEvent, string> = {
  none: "Без ожидания",
  "customer-response": "Ответ клиента",
  "preview-accepted": "Клиент принял превью",
  "payment-confirmed": "Платёж подтверждён",
  "delivery-confirmed": "Результат выдан",
  "run-completed": "Работа исполнителя завершена",
};

export function timestampLabel(date: string, withYear = false) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(date));
}

export function newStage(id: string): WorkflowStage {
  return {
    id,
    title: "",
    instruction: "",
    evidence: "",
    missingData: "",
    waitFor: "none",
    waitHours: 0,
    reminders: "",
    silenceOutcome: "",
    operations: [],
    assignee: "",
    payer: "",
    settlementEvent: "none",
  };
}

export function toDraft(release: WorkflowRelease): WorkflowDraft {
  return {
    id: release.id,
    shopId: release.shopId,
    title: release.title,
    applicability: release.applicability,
    goal: release.goal,
    stages: release.stages.map((stage) => ({ ...stage })),
  };
}

export function taskHref(taskId: string) {
  const params = new URLSearchParams({
    id: "modules-crm-models-widget-singlepage-workflow-workspace--default",
    viewMode: "story",
    task: taskId,
  });
  return `iframe.html?${params}`;
}

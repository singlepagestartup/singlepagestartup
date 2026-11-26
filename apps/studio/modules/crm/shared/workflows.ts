import type { IOpenAIWorkModelSelection } from "@sps/shared-utils/provider-models";

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

export const workflowMaterialOptions = {
  "request-routing": {
    ru: {
      label: "Проверить, понятен ли запрос",
      description:
        "Проверяет последнее сообщение клиента перед ответом. Если запрос неясен, предлагает задать уточняющий вопрос.",
    },
    en: {
      label: "Check whether the request is clear",
      description:
        "Checks the latest customer message before replying. If it is unclear, prompts the assistant to ask a follow-up question.",
    },
  },
  "tool-selection": {
    ru: {
      label: "Выбрать один инструмент",
      description:
        "Из доступных инструментов поиска, анализа изображения и расшифровки выбирает один или пропускает все.",
    },
    en: {
      label: "Choose one tool",
      description:
        "Chooses at most one available tool for search, image analysis, or transcription. It can skip them all.",
    },
  },
  compression: {
    ru: {
      label: "Сократить длинную переписку",
      description:
        "Если в переписке больше восьми реплик, кратко пересказывает ранние сообщения для следующего ответа.",
    },
    en: {
      label: "Summarize a long conversation",
      description:
        "If the conversation has more than eight messages, summarizes earlier messages for the next reply.",
    },
  },
  "knowledge-search": {
    ru: {
      label: "Искать в материалах магазина",
      description:
        "Ищет по смыслу в доступных проиндексированных источниках магазина. Подходящие фрагменты помогают подготовить ответ.",
    },
    en: {
      label: "Search store materials",
      description:
        "Searches accessible, indexed store sources by meaning. Relevant excerpts help the assistant prepare the reply.",
    },
  },
  vision: {
    ru: {
      label: "Проанализировать изображение",
      description:
        "Может описать вложение JPEG, PNG или WebP из сообщения клиента, на которое готовится ответ.",
    },
    en: {
      label: "Analyze an image",
      description:
        "Can describe a JPEG, PNG, or WebP attachment from the customer message being answered.",
    },
  },
  transcription: {
    ru: {
      label: "Расшифровать аудио",
      description:
        "Может преобразовать поддерживаемый несжатый WAV из сообщения клиента в текст для ответа.",
    },
    en: {
      label: "Transcribe audio",
      description:
        "Can transcribe a supported uncompressed WAV from the customer message being answered.",
    },
  },
} as const;

export type TWorkflowMaterial = keyof typeof workflowMaterialOptions;

export interface IWorkflowTransition {
  id: string;
  event: Exclude<WorkflowEvent, "none"> | "manual";
  destination: string;
}

export interface WorkflowStage {
  id: string;
  title: string;
  instruction: string;
  output?: "chat" | "pdf" | "image";
  provider?: IOpenAIWorkModelSelection;
  imageBrief?: "marketplace-cover";
  imageBriefAutoGenerate?: boolean;
  coverAttachmentRole?: "product-photo" | "style-reference";
  evidence: string;
  missingData: string;
  waitFor: WorkflowEvent;
  waitHours: number;
  reminders: string;
  silenceOutcome: "" | "completed" | "closed";
  operations: WorkflowOperation[];
  materials?: TWorkflowMaterial[];
  transitions?: IWorkflowTransition[];
  assignee: string;
  payer: string;
  maxStageAmount?: string;
  maxRunAmount?: string;
  settlementEvent: WorkflowEvent;
  settlementInstruction?: string;
  resultPricing?: WorkflowResultPricing;
  archived?: boolean;
}

export interface Workflow {
  id: string;
  shopId: string;
  title: string;
  applicability: string;
  goal: string;
  stages: WorkflowStage[];
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
  stageId: string;
  revision: number;
  label: string;
  customer: string;
  assignee: string;
  assignmentCandidateIds?: string[];
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
  workflows: Workflow[];
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

export function taskHref(taskId: string) {
  const params = new URLSearchParams({
    id: "modules-crm-models-widget-singlepage-workflow-workspace--default",
    viewMode: "story",
    task: taskId,
  });
  return `iframe.html?${params}`;
}

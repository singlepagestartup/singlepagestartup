import {
  newStage,
  type TaskState,
  type WorkflowFixture,
  type WorkflowRelease,
  type WorkflowStage,
  type WorkflowTask,
} from "./workflows";

const stages: WorkflowStage[] = [
  {
    ...newStage("intake"),
    title: "Новые",
    instruction:
      "Уточни формат, сюжет и дату выдачи иллюстрации. Запиши требования к исходному файлу.",
    evidence: "В треде есть формат, сюжет и согласованная дата.",
    missingData: "Задай один вопрос по недостающему требованию.",
    waitFor: "customer-response",
    waitHours: 48,
    reminders: "24",
    silenceOutcome: "closed",
    operations: ["reply", "handoff"],
    assignee: "maria",
    payer: "shop",
    settlementEvent: "run-completed",
  },
  {
    ...newStage("production"),
    title: "В работе",
    instruction: "Собери первую версию иллюстрации и приложи превью к треду.",
    evidence: "К сообщению приложена именованная версия превью.",
    missingData: "Запроси недостающие материалы у клиента.",
    operations: ["reply", "handoff"],
    assignee: "illustration-agent",
    payer: "shop",
    settlementEvent: "run-completed",
  },
  {
    ...newStage("review"),
    title: "На согласовании",
    instruction:
      "Покажи превью. Если клиент выбрал версию, запиши её номер и предложи оплатить заказ. Если нужна правка, уточни изменение.",
    evidence: "Сообщение клиента содержит номер принятой версии превью.",
    missingData: "Переспроси, какую версию клиент принимает.",
    waitFor: "preview-accepted",
    waitHours: 72,
    reminders: "24, 48",
    silenceOutcome: "closed",
    operations: ["reply", "request-revision", "checkout", "handoff"],
    assignee: "studio-assistant",
    payer: "shop",
    settlementEvent: "run-completed",
  },
  {
    ...newStage("payment"),
    title: "К оплате",
    instruction:
      "Отправь ссылку на заказ. Дождись подтверждения платежа, затем передай результат.",
    evidence: "Платёжный домен подтвердил оплату заказа.",
    missingData: "Проверь состояние заказа и сообщи клиенту срок оплаты.",
    waitFor: "payment-confirmed",
    waitHours: 72,
    reminders: "48",
    silenceOutcome: "closed",
    operations: ["reply", "checkout"],
    assignee: "maria",
    payer: "shop",
    settlementEvent: "payment-confirmed",
  },
];

const currentRelease: WorkflowRelease = {
  id: "illustration",
  shopId: "forma",
  title: "Иллюстрация на заказ",
  applicability:
    "Клиент заказывает иллюстрацию с оплатой после приёмки превью.",
  goal: "Клиент получает исходный файл согласованной версии после оплаты.",
  version: 3,
  publishedAt: "2026-11-17T09:00:00+03:00",
  stages,
};

const oldRelease: WorkflowRelease = {
  ...currentRelease,
  version: 2,
  publishedAt: "2026-10-24T10:00:00+03:00",
  stages: [
    ...stages.slice(0, 3),
    {
      ...stages[3],
      id: "manual-payment",
      title: "Оплата по счёту",
      archived: true,
    },
  ],
};

const adviceRelease: WorkflowRelease = {
  id: "advice",
  shopId: "forma",
  title: "Консультация по товару",
  applicability: "Клиент открыл чат из карточки товара.",
  goal: "Клиент получает ответ и при желании переходит к оформлению заказа.",
  version: 1,
  publishedAt: "2026-11-06T10:00:00+03:00",
  stages: [
    {
      ...stages[0],
      instruction:
        "Уточни вопрос клиента и определись, какой товар обсуждается.",
    },
    {
      ...stages[1],
      title: "Отвечаем",
      instruction: "Проверь сведения о товаре и ответь клиенту.",
    },
  ],
};

function task(
  id: string,
  label: string,
  customer: string,
  stageId: string,
  assignee: string,
  state: TaskState,
  dueAt?: string,
  waitingFor?: string,
): WorkflowTask {
  return {
    id,
    shopId: currentRelease.shopId,
    workflowId: currentRelease.id,
    version: currentRelease.version,
    stageId,
    label,
    customer,
    assignee,
    state,
    dueAt: dueAt && `2026-11-${dueAt}+03:00`,
    waitingFor,
    revision: 2,
    updatedAt: "2026-11-19T10:42:00+03:00",
    history: [
      {
        id: `${id}-received`,
        stageId: "intake",
        actor: "Мария Волкова",
        at: "2026-11-18T11:14:00+03:00",
        reason: "Принято обращение из магазина.",
      },
      ...(stageId === "intake"
        ? []
        : [
            {
              id: `${id}-move`,
              stageId,
              actor: "Мария Волкова",
              at: "2026-11-19T10:42:00+03:00",
              reason: "Требования уточнены, работа передана исполнителю.",
              evidence: "Требования согласованы в треде.",
            },
          ]),
    ],
    assignments: [
      {
        id: `${id}-assignment`,
        assignee,
        at: "2026-11-18T11:14:00+03:00",
        reason: "Исполнитель назначен по правилам этапа.",
      },
    ],
    costs: [],
  };
}

const reviewTask = task(
  "CRM-124",
  "Обложка для журнала «Контур»",
  "Анна Ковалёва",
  "review",
  "studio-assistant",
  "waiting",
  "20T17:00:00",
  "Выбор версии превью",
);
reviewTask.history[1] = {
  ...reviewTask.history[1],
  reason: "Клиент получил две версии превью.",
  evidence: "Превью v1 и v2 приложены к сообщению.",
};
reviewTask.assignments = [
  {
    id: "124-assign-1",
    assignee: "maria",
    at: "2026-11-18T11:14:00+03:00",
    reason: "Менеджер принял поручение.",
  },
  {
    id: "124-assign-2",
    assignee: "studio-assistant",
    at: "2026-11-19T10:42:00+03:00",
    reason: "Мария передала согласование ассистенту.",
  },
];
reviewTask.thread = {
  id: "thread-124",
  title: "Согласование обложки",
  latestMessage: "Вторая версия ближе к тому, что нужно. Уточню у редактора.",
};
reviewTask.order = {
  id: "418-02",
  title: "Иллюстрация для печати",
  state: "Черновик",
};
reviewTask.costs = [
  {
    id: "RUN-2184",
    at: "2026-11-19T10:39:00+03:00",
    title: "Подготовка ответа · OpenRouter",
    status: "Завершена",
    amount: "12 токенов",
    transfer: "12 токенов · Мастерская Север → Ассистент студии",
  },
  {
    id: "RUN-2183",
    at: "2026-11-19T10:37:00+03:00",
    title: "Подготовка ответа · OpenRouter",
    status: "Отказ провайдера",
    amount: "0 токенов",
  },
];
reviewTask.terms =
  "Оплата после приёмки превью. После оплаты доступен исходный файл для печати.";
reviewTask.result = {
  version: "v2",
  status: "На согласовании",
  title: "Превью обложки",
};

const oldTask = {
  ...task(
    "CRM-098",
    "Портрет в подарок",
    "Елена Соколова",
    "manual-payment",
    "maria",
    "waiting",
    "23T12:00:00",
    "Подтверждение счёта",
  ),
  version: 2,
  order: { id: "ЗК-411", title: "Портрет", state: "Ожидает оплаты" },
};

export const demoWorkflows: WorkflowFixture = {
  shops: [
    { id: "forma", title: "Мастерская Север" },
    { id: "prisma", title: "Студия «Призма»" },
  ],
  people: [
    { id: "maria", name: "Мария Волкова", initials: "МВ", kind: "human" },
    { id: "igor", name: "Игорь Орлов", initials: "ИО", kind: "human" },
    {
      id: "studio-assistant",
      name: "Ассистент студии",
      initials: "АС",
      kind: "agent",
    },
    {
      id: "illustration-agent",
      name: "Агент иллюстраций",
      initials: "АИ",
      kind: "agent",
    },
  ],
  payers: [
    { id: "shop", title: "Кошелёк магазина" },
    { id: "assistant", title: "Кошелёк исполнителя" },
  ],
  releases: [
    currentRelease,
    oldRelease,
    adviceRelease,
    { ...adviceRelease, id: "prisma-advice", shopId: "prisma" },
  ],
  tasks: [
    task(
      "CRM-128",
      "Иллюстрация для ноябрьской рассылки",
      "Полина Андреева",
      "intake",
      "maria",
      "active",
      "20T12:00:00",
    ),
    task(
      "CRM-127",
      "Серия иконок для каталога",
      "Павел Сергеев",
      "intake",
      "igor",
      "active",
      "21T14:00:00",
    ),
    {
      ...task(
        "CRM-126",
        "Набор открыток для Winter Market",
        "Денис Корнеев",
        "production",
        "illustration-agent",
        "active",
        "21T18:00:00",
      ),
      order: { id: "ЗК-514", title: "Набор открыток", state: "Черновик" },
    },
    task(
      "CRM-125",
      "Постер для выставки «Берег»",
      "Софья Миронова",
      "production",
      "igor",
      "waiting",
      "22T12:00:00",
      "Фотографии от клиента",
    ),
    reviewTask,
    task(
      "CRM-121",
      "Обложка книги «Время в пути»",
      "Вера Ким",
      "review",
      "studio-assistant",
      "waiting",
      "21T16:00:00",
      "Правки клиента",
    ),
    oldTask,
    {
      ...task(
        "CRM-119",
        "Подбор формата печати",
        "Роман Петров",
        "production",
        "maria",
        "completed",
      ),
      workflowId: "advice",
      version: 1,
    },
  ],
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Widget } from "../..";
import type {
  IAssignment,
  IConnection,
  ICredentialValues,
  IProviderAttempt,
  IWorkBudget,
} from "./interface";

interface IPreviewProps {
  scenario:
    | "ready"
    | "empty"
    | "budget-exhausted"
    | "provider-denied"
    | "awaiting-reconciliation"
    | "access-denied";
}

const assistant = "Алекс";
const subjects = [
  {
    id: "north-router",
    name: "Агент OpenRouter",
    provider: "OpenRouter" as const,
    wallet: 30,
  },
  {
    id: "north-direct",
    name: "Агент OpenAI",
    provider: "OpenAI" as const,
    wallet: 0,
  },
];
const northConnections: IConnection[] = [
  {
    id: "conn-or",
    provider: "OpenRouter",
    label: "Север · OpenRouter",
    externalAccount: "sever-or-demo",
    version: 2,
    state: "active",
  },
  {
    id: "conn-oa",
    provider: "OpenAI",
    label: "Север · OpenAI API",
    externalAccount: "sever-ai-demo",
    version: 1,
    state: "active",
  },
];
const firstAttempt: IProviderAttempt = {
  id: "ATT-418-01",
  provider: "OpenRouter",
  subjectName: "Агент OpenRouter",
  connectionLabel: "Север · OpenRouter",
  connectionVersion: 2,
  externalAccount: "sever-or-demo",
  purpose: "Черновик стратегии",
  model: "openai/gpt-4.1-mini",
  state: "settled",
  reserve: 40,
  spend: 38,
  externalCost: "0.030",
  externalId: "gen-studio-418-01",
  units: { input: 2400, output: 620 },
  receipt: { id: "SPS-418-01", work: 38, delegated: 30 },
};
const uncertainAttempt: IProviderAttempt = {
  ...firstAttempt,
  id: "ATT-418-02",
  purpose: "Превью стратегии",
  state: "reconciling",
  spend: undefined,
  externalCost: undefined,
  externalId: undefined,
  receipt: undefined,
  units: undefined,
};
const settledSecondAttempt = {
  spend: 26,
  units: { input: 1684, output: 322 },
};

function Preview({ scenario }: IPreviewProps) {
  const [connections, setConnections] = useState<IConnection[]>(
    northConnections.map((connection) =>
      scenario === "provider-denied" && connection.provider === "OpenRouter"
        ? { ...connection, state: "denied" }
        : connection,
    ),
  );
  const [assignment, setAssignment] = useState<IAssignment>({
    provider: "OpenRouter",
    subjectId: "north-router",
    connectionId: "conn-or",
    model: "openai/gpt-4.1-mini",
  });
  const [wallet, setWallet] = useState(scenario === "empty" ? 218 : 180);
  const [limit, setLimit] = useState(
    scenario === "budget-exhausted" ? 50 : 100,
  );
  const [attempts, setAttempts] = useState<IProviderAttempt[]>(
    scenario === "empty"
      ? []
      : scenario === "awaiting-reconciliation"
        ? [uncertainAttempt, firstAttempt]
        : scenario === "provider-denied"
          ? [{ ...uncertainAttempt, state: "denied" }, firstAttempt]
          : [firstAttempt],
  );
  const [feedback, setFeedback] = useState("");
  const spent = attempts.reduce(
    (sum, attempt) => sum + (attempt.spend ?? 0),
    0,
  );
  const reserved = attempts.reduce(
    (sum, attempt) =>
      sum +
      (attempt.state === "reserved" || attempt.state === "reconciling"
        ? attempt.reserve
        : 0),
    0,
  );
  const connection = connections.find(
    ({ id }) => id === assignment.connectionId,
  );
  const required = 40;
  const status: IWorkBudget["status"] = reserved
    ? "reconciling"
    : connection?.state !== "active"
      ? "waiting-provider"
      : Math.min(wallet, limit - spent) < required
        ? "waiting-budget"
        : "ready";
  const payer = "Кошелёк магазина";
  const budget: IWorkBudget = {
    taskId: "418-02",
    payer,
    wallet,
    limit,
    reserved,
    spent,
    required,
    status,
  };
  const delegated = (provider: string) =>
    attempts.reduce(
      (sum, attempt) =>
        sum +
        (attempt.provider === provider ? (attempt.receipt?.delegated ?? 0) : 0),
      0,
    );
  const operatorWallet = attempts.reduce(
    (sum, attempt) =>
      sum +
      (attempt.receipt ? attempt.receipt.work - attempt.receipt.delegated : 0),
    0,
  );

  function saveCredential({
    provider,
    connectionId,
    label,
    externalAccount,
  }: ICredentialValues) {
    // The Storybook callback consumes the sample only at the form boundary.
    if (connectionId) {
      setConnections((current) =>
        current.map((entry) =>
          entry.id === connectionId
            ? { ...entry, version: entry.version + 1, state: "active" }
            : entry,
        ),
      );
      setFeedback("Версия ключа сохранена.");
      return;
    }
    setConnections((current) => [
      ...current,
      {
        id: `conn-${current.length + 1}`,
        provider,
        label,
        externalAccount,
        version: 1,
        state: "active",
      },
    ]);
    setFeedback("Ключ сохранён. Выберите новое подключение по метке.");
  }

  function reserve() {
    if (status !== "ready" || !connection) {
      setFeedback(
        status === "waiting-budget"
          ? "Резерв не создан. У задачи недостаточно средств."
          : "Вызов не отправлен.",
      );
      return;
    }
    const subjectName = subjects.find(
      ({ id }) => id === assignment.subjectId,
    )?.name;
    if (!subjectName) return;
    const attempt: IProviderAttempt = {
      id: `ATT-418-${String(attempts.length + 1).padStart(2, "0")}`,
      provider: connection.provider,
      subjectName,
      connectionLabel: connection.label,
      connectionVersion: connection.version,
      externalAccount: connection.externalAccount,
      purpose: "Превью стратегии",
      model: assignment.model,
      state: "reserved",
      reserve: required,
    };
    setAttempts((current) => [attempt, ...current]);
    setFeedback(`Попытка ${attempt.id} открыта. В резерве ${required} SPS.`);
  }

  function reconcile(id: string) {
    const attempt = attempts.find((entry) => entry.id === id);
    if (
      !attempt ||
      (attempt.state !== "reserved" && attempt.state !== "reconciling")
    )
      return;
    const estimated = attempt.provider === "OpenAI";
    const externalCost = estimated ? "0.019" : "0.020";
    setAttempts((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...settledSecondAttempt,
              state: "settled",
              externalCost,
              estimated,
              externalId: `${estimated ? "resp" : "gen"}-studio-${id.toLowerCase()}`,
              receipt: {
                id: id.replace("ATT", "SPS"),
                work: settledSecondAttempt.spend,
                delegated: estimated ? 19 : 20,
              },
            }
          : entry,
      ),
    );
    setWallet((current) => current - settledSecondAttempt.spend);
    setFeedback(
      `Расход ${settledSecondAttempt.spend} SPS подтверждён. Освобождено ${attempt.reserve - settledSecondAttempt.spend} SPS.`,
    );
  }

  return (
    <Widget
      variant="subject-me-store-provider-settings"
      store="Мастерская «Север»"
      access={scenario === "access-denied" ? "denied" : "owner"}
      assistant={{ name: assistant, wallet: operatorWallet }}
      subjects={subjects.map((subject) => ({
        ...subject,
        wallet: delegated(subject.provider),
      }))}
      connections={connections}
      assignment={assignment}
      budget={budget}
      attempts={attempts}
      feedback={feedback}
      onAssign={(next) => {
        setAssignment(next);
        setFeedback("Назначение сохранено.");
      }}
      onSaveCredential={saveCredential}
      onRevoke={(id) => {
        setConnections((current) =>
          current.map((entry) =>
            entry.id === id ? { ...entry, state: "revoked" } : entry,
          ),
        );
        setFeedback("Ключ отозван.");
      }}
      onSaveLimit={(next) => {
        setLimit(next);
        setFeedback(`Лимит задачи обновлён до ${next} SPS.`);
      }}
      onReserve={reserve}
      onReconcile={reconcile}
    />
  );
}

const meta = {
  id: "modules-rbac-models-widget-singlepage-subject-me-store-provider-settings",
  title: "Modules/RBAC/Widget/Singlepage/subject-me-store-provider-settings",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: { scenario: "ready" },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { scenario: "empty" } };
export const BudgetExhausted: Story = {
  args: { scenario: "budget-exhausted" },
};
export const ProviderDenied: Story = { args: { scenario: "provider-denied" } };
export const AwaitingReconciliation: Story = {
  args: { scenario: "awaiting-reconciliation" },
};
export const AccessDenied: Story = { args: { scenario: "access-denied" } };

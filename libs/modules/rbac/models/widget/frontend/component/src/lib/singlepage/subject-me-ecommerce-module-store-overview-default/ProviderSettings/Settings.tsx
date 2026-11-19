"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IConnectionCommand,
  IProviderCapability,
  IProviderSettings,
  IProviderType,
} from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import { Button } from "@sps/shared-ui-shadcn";
import { Key, Link2, Wallet } from "lucide-react";
import type { IProviderSettingsProps } from "./interface";

type TConnection = IProviderSettings["connections"][number];
type TCommand = (data: IConnectionCommand) => Promise<boolean>;
type TLabels = (russian: string, english: string) => string;

const inputClass =
  "mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const panelClass =
  "min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6";
const providerName: Record<IProviderType, string> = {
  openai: "OpenAI API",
  openrouter: "OpenRouter",
};

export function Settings({
  subjectId,
  ecommerceModuleStoreId: storeId,
  language,
}: IProviderSettingsProps & { subjectId: string }) {
  const copy: TLabels = (ru, en) => (language === "ru" ? ru : en);
  const result = api.providerConnections({ id: subjectId, storeId });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function command(data: IConnectionCommand) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api.changeProviderConnection({ id: subjectId, storeId, data });
      setNotice(copy("Изменения сохранены.", "Changes saved."));
      return true;
    } catch {
      setError(
        copy(
          "Не удалось сохранить изменения. Проверьте поля и права магазина.",
          "Could not save the changes. Check the fields and store permissions.",
        ),
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-muted p-4 sm:p-6">
      <h2
        ref={heading}
        tabIndex={-1}
        className="text-2xl font-semibold tracking-tight focus:outline-none"
      >
        {copy("Подключения и бюджет", "Connections and budget")}
      </h2>
      {result.isPending && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {copy("Загружаем настройки…", "Loading settings…")}
        </p>
      )}
      {result.isError && (
        <p role="alert" className="mt-3 text-sm">
          {copy(
            "Настройки доступны владельцу магазина.",
            "Store settings are available to the owner.",
          )}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {result.data && (
        <div className="mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-2">
          <ConnectionPanel
            data={result.data}
            storeId={storeId}
            pending={pending}
            command={command}
            copy={copy}
          />
          <SpendPanel
            data={result.data}
            storeId={storeId}
            pending={pending}
            command={command}
            copy={copy}
          />
        </div>
      )}
    </div>
  );
}

function ConnectionPanel({
  data,
  storeId,
  pending,
  command,
  copy,
}: {
  data: IProviderSettings;
  storeId: string;
  pending: boolean;
  command: TCommand;
  copy: TLabels;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<"new" | "rotate">();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const selected =
    data.connections.find(({ id }) => id === selectedId) ?? data.connections[0];

  return (
    <section className={panelClass}>
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Link2 aria-hidden="true" className="size-5" />{" "}
        {copy("Подключение агента", "Agent connection")}
      </h3>
      <label className="mt-4 block text-sm font-medium">
        {copy("Метка подключения", "Connection label")}
        <select
          aria-label={copy("Метка подключения", "Connection label")}
          className={inputClass}
          value={selected?.id ?? ""}
          onChange={(event) => {
            setSelectedId(event.currentTarget.value);
            setForm(undefined);
            setConfirmRevoke(false);
          }}
        >
          {!data.connections.length && (
            <option value="">
              {copy("Подключений пока нет", "No connections yet")}
            </option>
          )}
          {data.connections.map(({ id, label, provider }) => (
            <option key={id} value={id}>
              {label} · {providerName[provider]}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <div className="mt-3 rounded-xl border border-border bg-muted p-3 text-sm">
          <p className="font-semibold break-words">
            {selected.label} ·{" "}
            {selected.active
              ? copy("Активно", "Active")
              : copy("Отозвано", "Revoked")}
          </p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {copy("Внешний аккаунт", "External account")}{" "}
            {selected.externalAccount}
          </p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {copy("Версия ключа", "Key version")} {selected.version}
          </p>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {copy("Агент провайдера", "Provider agent")} {selected.subjectId}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => {
                setForm("rotate");
                setConfirmRevoke(false);
              }}
            >
              {copy("Заменить ключ", "Replace key")}
            </Button>
            {selected.active && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() => {
                  setConfirmRevoke(true);
                  setForm(undefined);
                }}
              >
                {copy("Отозвать ключ", "Revoke key")}
              </Button>
            )}
          </div>
          {confirmRevoke && (
            <div className="mt-3 border-t border-border pt-3">
              <p>
                {copy(
                  "Новые вызовы по этому подключению остановятся.",
                  "New calls using this connection will stop.",
                )}
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-2 min-h-11"
                disabled={pending}
                onClick={async () => {
                  if (
                    await command({
                      operation: "revoke",
                      storeId,
                      connectionId: selected.id,
                      expectedVersion: selected.version,
                    })
                  )
                    setConfirmRevoke(false);
                }}
              >
                {copy("Подтвердить отзыв", "Confirm revocation")}
              </Button>
            </div>
          )}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="mt-3 min-h-11"
        disabled={pending}
        onClick={() => {
          setForm("new");
          setConfirmRevoke(false);
        }}
      >
        <Key className="mr-2 size-4" aria-hidden="true" />{" "}
        {copy("Добавить ключ", "Add key")}
      </Button>
      {form && (
        <CredentialForm
          key={form + selected?.id}
          storeId={storeId}
          selected={form === "rotate" ? selected : undefined}
          command={command}
          pending={pending}
          copy={copy}
          close={() => setForm(undefined)}
        />
      )}
      {selected?.active && (
        <AssignmentForm
          key={selected.id}
          storeId={storeId}
          data={data}
          connection={selected}
          command={command}
          pending={pending}
          copy={copy}
        />
      )}
    </section>
  );
}

function CredentialForm({
  selected,
  storeId,
  command,
  pending,
  copy,
  close,
}: {
  selected?: TConnection;
  storeId: string;
  command: TCommand;
  pending: boolean;
  copy: TLabels;
  close: () => void;
}) {
  const firstField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstField.current?.focus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const secret = String(fields.get("secret") ?? "");
    const payload: IConnectionCommand = selected
      ? {
          operation: "rotate",
          storeId,
          connectionId: selected.id,
          expectedVersion: selected.version,
          secret,
        }
      : {
          operation: "connect",
          storeId,
          secret,
          label: String(fields.get("label") ?? "").trim(),
          externalAccount: String(fields.get("account") ?? "").trim(),
          provider:
            fields.get("provider") === "openai" ? "openai" : "openrouter",
        };
    form.reset();
    if (await command(payload)) close();
  }

  return (
    <form
      className="mt-3 grid gap-3 rounded-xl border border-border bg-background p-3"
      onSubmit={submit}
    >
      {!selected && (
        <>
          <label className="text-sm font-medium">
            {copy("Провайдер", "Provider")}
            <select
              name="provider"
              aria-label={copy("Провайдер", "Provider")}
              className={inputClass}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI API</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            {copy("Метка ключа", "Key label")}
            <input
              ref={firstField}
              name="label"
              maxLength={150}
              required
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            {copy("Внешний аккаунт", "External account")}
            <input
              name="account"
              maxLength={150}
              required
              className={inputClass}
            />
          </label>
        </>
      )}
      <label className="text-sm font-medium">
        {copy("Секретный ключ", "API key")}
        <input
          ref={selected ? firstField : undefined}
          name="secret"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={8192}
          required
          className={inputClass}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        {copy(
          "После отправки поле очищается. Ключ нельзя посмотреть повторно.",
          "The field clears on submission. You cannot retrieve the key later.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          type="submit"
          disabled={pending}
          className="min-h-11"
        >
          {copy("Сохранить ключ", "Save key")}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={pending}
          className="min-h-11"
          onClick={close}
        >
          {copy("Отменить", "Cancel")}
        </Button>
      </div>
    </form>
  );
}

function AssignmentForm({
  data,
  connection,
  storeId,
  command,
  pending,
  copy,
}: {
  data: IProviderSettings;
  connection: TConnection;
  storeId: string;
  command: TCommand;
  pending: boolean;
  copy: TLabels;
}) {
  const agentOptions = data.assistants ?? [];
  const storeDefault = "store";
  const [capability, setCapability] = useState<IProviderCapability>("text");
  const [assistantId, setAssistantId] = useState(
    () =>
      data.assignments.find(
        (entry) =>
          entry.identityId === connection.identityId &&
          entry.capability === "text",
      )?.subjectId ?? storeDefault,
  );
  const assigned = data.assignments.find(
    (entry) =>
      entry.identityId === connection.identityId &&
      entry.subjectId === (assistantId === storeDefault ? null : assistantId) &&
      entry.capability === capability,
  );
  const terms = assigned?.terms as
    Extract<IConnectionCommand, { operation: "assign" }>["terms"] | undefined;
  const imageModel =
    connection.provider === "openai"
      ? "gpt-image-2.5-flare-2026-09-08"
      : "openai/gpt-image-2.5-flare";
  const capabilities: { id: IProviderCapability; label: string }[] = [
    { id: "text", label: copy("Текст и PDF", "Text and PDF") },
    { id: "image", label: copy("Генерация изображений", "Image generation") },
    {
      id: "decision",
      label: copy("Выбор маршрута и инструмента", "Routing and tool selection"),
    },
    { id: "embedding", label: copy("Поиск по знаниям", "Knowledge search") },
    {
      id: "compression",
      label: copy("Сжатие переписки", "Conversation compression"),
    },
    { id: "vision", label: copy("Анализ изображений", "Image analysis") },
  ];
  if (connection.provider === "openai") {
    capabilities.push({
      id: "transcription",
      label: copy("Расшифровка аудио", "Audio transcription"),
    });
  }
  const nativePrefix = connection.provider === "openrouter" ? "openai/" : "";
  const defaultModel = {
    text: undefined,
    image: imageModel,
    decision: nativePrefix + "gpt-4o-mini",
    embedding: nativePrefix + "text-embedding-3-small",
    compression: nativePrefix + "gpt-4o-mini",
    vision: nativePrefix + "gpt-4o-mini",
    transcription: "gpt-transcribe",
  }[capability];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const assignment = {
      storeId,
      connectionId: connection.id,
      model: value("model"),
      capability,
      terms: {
        maxInputTokens: Number(value("maxInputTokens")),
        maxOutputTokens: Number(value("maxOutputTokens")),
        maxCostUsd: value("maxCostUsd"),
        inputUsdPerMillion: value("inputUsdPerMillion"),
        outputUsdPerMillion: value("outputUsdPerMillion"),
        usdPerSps: value("usdPerSps"),
        workMultiplier: value("workMultiplier"),
        version: value("version"),
      },
    };
    const payload: IConnectionCommand =
      assistantId === storeDefault
        ? { ...assignment, operation: "assign-default" }
        : { ...assignment, operation: "assign", assistantId };
    void command(payload);
  }

  const textFields: Array<{
    key: keyof NonNullable<typeof terms>;
    label: string;
  }> = [
    {
      key: "maxInputTokens",
      label: copy("Входные токены, максимум", "Input token cap"),
    },
    {
      key: "maxOutputTokens",
      label: copy("Выходные токены, максимум", "Output token cap"),
    },
    { key: "maxCostUsd", label: copy("Потолок вызова, USD", "Call cap, USD") },
    {
      key: "inputUsdPerMillion",
      label: copy("USD за 1 млн входных токенов", "USD per 1M input tokens"),
    },
    {
      key: "outputUsdPerMillion",
      label: copy("USD за 1 млн выходных токенов", "USD per 1M output tokens"),
    },
    { key: "usdPerSps", label: copy("USD за 1 SPS", "USD per SPS") },
    {
      key: "workMultiplier",
      label: copy("Коэффициент расчёта", "Work multiplier"),
    },
    { key: "version", label: copy("Версия тарифа", "Terms version") },
  ];

  return (
    <form
      className="mt-5 space-y-3 border-t border-border pt-4"
      onSubmit={submit}
    >
      <h4 className="font-semibold">
        {copy("Назначение и лимиты", "Assignment and limits")}
      </h4>
      <label className="block text-sm font-medium">
        {copy("Кому доступна модель", "Who can use the model")}
        <select
          name="assistantId"
          value={assistantId}
          onChange={(event) => setAssistantId(event.currentTarget.value)}
          className={inputClass}
          required
        >
          <option value={storeDefault}>
            {copy(
              "Новые и действующие ассистенты магазина",
              "New and existing store assistants",
            )}
          </option>
          {agentOptions.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {copy("Назначение модели", "Model capability")}
        <select
          value={capability}
          onChange={(event) => {
            const selected = capabilities.find(
              ({ id }) => id === event.currentTarget.value,
            );
            if (selected) {
              setCapability(selected.id);
            }
          }}
          className={inputClass}
        >
          {capabilities.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div key={`${assistantId}:${capability}`} className="grid gap-3">
        <label className="block text-sm font-medium">
          {copy("Модель", "Model")}
          <input
            name="model"
            defaultValue={
              capability === "image" || capability === "transcription"
                ? defaultModel
                : (assigned?.model ?? defaultModel)
            }
            readOnly={capability === "image" || capability === "transcription"}
            required
            maxLength={150}
            className={inputClass}
          />
        </label>
        <details className="rounded-lg border border-border px-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
            {copy("Условия расчёта и лимиты", "Terms and limits")}
          </summary>
          {capability === "image" && (
            <p className="mb-3 text-sm text-muted-foreground">
              {copy(
                "Один вызов создаёт одно изображение 1024 × 1024. Для расчёта резерва укажите предел от 16 384 выходных токенов.",
                "Each request produces one 1024 × 1024 image. Set an output limit of at least 16,384 tokens for reservations.",
              )}
            </p>
          )}
          <div className="grid gap-3 pb-3 sm:grid-cols-2">
            {textFields.map(({ key, label }) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <input
                  name={key}
                  required
                  defaultValue={terms?.[key]}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </details>
      </div>
      <Button
        variant="primary"
        type="submit"
        disabled={pending}
        className="min-h-11"
      >
        {copy("Сохранить назначение", "Save assignment")}
      </Button>
    </form>
  );
}

function SpendPanel({
  data,
  storeId,
  command,
  pending,
  copy,
}: {
  data: IProviderSettings;
  storeId: string;
  command: TCommand;
  pending: boolean;
  copy: TLabels;
}) {
  const [task, setTask] = useState("");
  const taskIds = [...new Set(data.operations.map(({ taskId }) => taskId))];
  const operations = data.operations.filter(
    ({ taskId }) => taskId === (task || taskIds[0]),
  );
  return (
    <section className={panelClass}>
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Wallet aria-hidden="true" className="size-5" />{" "}
        {copy("Бюджет и расходы задачи", "Work budget and spend")}
      </h3>
      {!taskIds.length && (
        <p className="mt-3 text-sm text-muted-foreground">
          {copy(
            "Резервов и переводов пока нет.",
            "No reservations or transfers yet.",
          )}
        </p>
      )}
      {taskIds.length > 0 && (
        <label className="mt-4 block text-sm font-medium">
          {copy("Задача", "Task")}
          <select
            aria-label={copy("Задача", "Task")}
            className={inputClass}
            value={task || taskIds[0]}
            onChange={(event) => setTask(event.currentTarget.value)}
          >
            {taskIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      )}
      <ul className="mt-4 space-y-2">
        {operations.map((operation) => (
          <li key={operation.id}>
            <details className="min-w-0 rounded-lg border border-border px-3">
              <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {operation.kind === "reserve"
                    ? copy("Резерв", "Reservation")
                    : copy("Перевод", "Transfer")}
                </span>
                <span>{operation.amount} SPS</span>
              </summary>
              <dl className="grid gap-2 border-t border-border py-3 text-sm">
                <LedgerPair label={copy("Статус", "Status")}>
                  {
                    {
                      held: copy("Зарезервировано", "Reserved"),
                      released: copy("Освобождено", "Released"),
                      settled: copy("Расход учтён", "Settled"),
                      posted: copy("Переведено", "Posted"),
                    }[operation.state]
                  }
                </LedgerPair>
                {operation.budget && (
                  <LedgerPair label={copy("Лимит", "Limit")}>
                    {operation.budget} SPS
                  </LedgerPair>
                )}
                <LedgerPair label={copy("Квитанция", "Receipt")}>
                  {operation.id}
                </LedgerPair>
                <LedgerPair label={copy("Отправитель", "Sender")}>
                  {operation.senderId}
                </LedgerPair>
                <LedgerPair label={copy("Получатель", "Recipient")}>
                  {operation.recipientId}
                </LedgerPair>
              </dl>
              <ProviderAttempt
                operation={operation}
                pending={pending}
                storeId={storeId}
                command={command}
                copy={copy}
              />
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LedgerPair({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-all">{children}</dd>
    </div>
  );
}

function ProviderAttempt({
  operation,
  pending,
  storeId,
  command,
  copy,
}: {
  operation: IProviderSettings["operations"][number];
  pending: boolean;
  storeId: string;
  command: TCommand;
  copy: TLabels;
}) {
  const [resolution, setResolution] = useState<"no-charge" | "charged">();
  const work = operation.providerWork;
  if (!work) return null;
  const target = {
    operation: "reconcile" as const,
    storeId,
    connectionId: work.connectionId,
    attemptId: work.attemptId,
  };

  async function reconcile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolution || pending) {
      return;
    }
    const fields = new FormData(event.currentTarget);
    if (fields.get("confirmed") !== "on") {
      return;
    }
    const reference = String(fields.get("reference") || "").trim();
    const result =
      resolution === "charged"
        ? {
            kind: "charged" as const,
            reference,
            usd: String(fields.get("usd") || "").trim(),
            inputTokens: Number(fields.get("inputTokens")),
            outputTokens: Number(fields.get("outputTokens")),
          }
        : { kind: "no-charge" as const, reference };
    if (await command({ ...target, resolution: result })) {
      setResolution(undefined);
    }
  }

  return (
    <div className="border-t border-border py-3">
      <dl className="grid gap-2 text-sm">
        <LedgerPair label={copy("Провайдер", "Provider")}>
          {work.provider}
        </LedgerPair>
        <LedgerPair label={copy("Внешний аккаунт", "External account")}>
          {work.externalAccount}
        </LedgerPair>
        <LedgerPair label={copy("Состояние вызова", "Attempt state")}>
          {work.state}
        </LedgerPair>
        <LedgerPair label={copy("ID попытки", "Attempt ID")}>
          {work.attemptId}
        </LedgerPair>
        {work.providerRequestId && (
          <LedgerPair label={copy("ID запроса", "Provider request ID")}>
            {work.providerRequestId}
          </LedgerPair>
        )}
        {work.usd && (
          <LedgerPair label={copy("Внешняя стоимость", "External cost")}>
            {work.usd} USD · {work.basis}
          </LedgerPair>
        )}
        {work.inputTokens !== undefined && (
          <LedgerPair label={copy("Входные токены", "Input tokens")}>
            {work.inputTokens}
          </LedgerPair>
        )}
        {work.outputTokens !== undefined && (
          <LedgerPair label={copy("Выходные токены", "Output tokens")}>
            {work.outputTokens}
          </LedgerPair>
        )}
      </dl>
      {work.state === "unknown" && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              type="button"
              disabled={pending}
              onClick={() => void command(target)}
            >
              {copy("Запросить расход у провайдера", "Check provider usage")}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              type="button"
              disabled={pending || Boolean(resolution)}
              onClick={() => setResolution("no-charge")}
            >
              {copy("Внести результат сверки", "Record reconciliation")}
            </Button>
          </div>
          {resolution && (
            <form
              className="space-y-3 rounded-lg border border-border p-3"
              onSubmit={reconcile}
            >
              <label className="block text-sm font-medium">
                {copy("Запись во внешнем кабинете", "External account record")}
                <select
                  className={inputClass}
                  value={resolution}
                  onChange={(event) =>
                    setResolution(
                      event.currentTarget.value === "charged"
                        ? "charged"
                        : "no-charge",
                    )
                  }
                >
                  <option value="no-charge">
                    {copy("Списания нет", "No charge")}
                  </option>
                  <option value="charged">
                    {copy("Есть списание", "Charged")}
                  </option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                {copy("Ссылка или ID записи", "Record link or ID")}
                <input
                  name="reference"
                  required
                  maxLength={150}
                  className={inputClass}
                />
              </label>
              {resolution === "charged" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm font-medium">
                    {copy("Списано, USD", "Charged, USD")}
                    <input
                      name="usd"
                      type="number"
                      min="0"
                      step="any"
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    {copy("Входные токены", "Input tokens")}
                    <input
                      name="inputTokens"
                      type="number"
                      min="0"
                      step="1"
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    {copy("Выходные токены", "Output tokens")}
                    <input
                      name="outputTokens"
                      type="number"
                      min="0"
                      step="1"
                      required
                      className={inputClass}
                    />
                  </label>
                </div>
              )}
              <label className="flex gap-2 text-sm">
                <input name="confirmed" type="checkbox" required />
                {copy(
                  "Я сверил эти сведения во внешнем кабинете.",
                  "I verified these details in the provider account.",
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="min-h-11"
                  disabled={pending}
                >
                  {copy("Подтвердить сверку", "Confirm reconciliation")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() => setResolution(undefined)}
                >
                  {copy("Отменить", "Cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

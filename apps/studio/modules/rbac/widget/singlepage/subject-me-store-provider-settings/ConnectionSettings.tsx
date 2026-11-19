"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Component as Icon } from "../../../../shared/icon";
import type {
  IAssignment,
  IComponentProps,
  IConnection,
  ICredentialValues,
  Provider,
} from "./interface";

const fieldClass =
  "mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryClass =
  "min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60";
const models: Record<Provider, string[]> = {
  OpenRouter: ["openai/gpt-4.1-mini", "openai/gpt-4.1"],
  OpenAI: ["gpt-4.1-mini", "gpt-4.1"],
};
const connectionStates = {
  active: "Активно",
  revoked: "Отозвано",
  denied: "Отказ провайдера",
} as const;

export function ConnectionSettings({
  subjects,
  connections,
  assignment,
  onAssign,
  onSaveCredential,
  onRevoke,
}: Pick<
  IComponentProps,
  | "subjects"
  | "connections"
  | "assignment"
  | "onAssign"
  | "onSaveCredential"
  | "onRevoke"
>) {
  const [selection, setSelection] = useState(assignment);
  const [credentialMode, setCredentialMode] = useState<"new" | "replace">();
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const headingId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const replaceButtonRef = useRef<HTMLButtonElement>(null);
  const revokeButtonRef = useRef<HTMLButtonElement>(null);
  const revokeConfirmRef = useRef<HTMLButtonElement>(null);
  const providerConnections = connections.filter(
    ({ provider }) => provider === selection.provider,
  );
  const providerSubjects = subjects.filter(
    ({ provider }) => provider === selection.provider,
  );
  const selectedConnection = providerConnections.find(
    ({ id }) => id === selection.connectionId,
  );

  useEffect(() => {
    if (revokeConfirm) revokeConfirmRef.current?.focus();
  }, [revokeConfirm]);

  function chooseProvider(provider: Provider) {
    const connection = connections.find(
      (candidate) =>
        candidate.provider === provider && candidate.state === "active",
    );
    setSelection({
      provider,
      subjectId:
        subjects.find((subject) => subject.provider === provider)?.id ?? "",
      connectionId: connection?.id ?? "",
      model: models[provider][0],
    });
    setCredentialMode(undefined);
    setRevokeConfirm(false);
  }

  function selectValue(key: keyof IAssignment, value: string) {
    setSelection({ ...selection, [key]: value });
    if (key === "connectionId") {
      setCredentialMode(undefined);
      setRevokeConfirm(false);
    }
  }

  function closeCredential() {
    const trigger = credentialMode === "new" ? addButtonRef : replaceButtonRef;
    setCredentialMode(undefined);
    trigger.current?.focus();
  }

  const saved = Object.entries(selection).every(
    ([key, value]) => assignment[key as keyof IAssignment] === value,
  );

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-xl font-semibold"
      >
        <Icon variant="phosphor" name="link" size={20} /> Подключение агента
      </h2>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAssign(selection);
        }}
      >
        <div className="min-w-0 text-sm font-medium">
          <label htmlFor={`${headingId}-provider`}>Провайдер</label>
          <select
            id={`${headingId}-provider`}
            className={fieldClass}
            value={selection.provider}
            onChange={(event) =>
              chooseProvider(event.currentTarget.value as Provider)
            }
          >
            <option value="OpenRouter">OpenRouter</option>
            <option value="OpenAI">OpenAI API (прямой)</option>
          </select>
        </div>
        <div className="min-w-0 text-sm font-medium">
          <label htmlFor={`${headingId}-subject`}>Агент провайдера</label>
          <select
            id={`${headingId}-subject`}
            required
            className={fieldClass}
            value={selection.subjectId}
            onChange={(event) =>
              selectValue("subjectId", event.currentTarget.value)
            }
          >
            {!selection.subjectId && <option value="">Выберите агента</option>}
            {providerSubjects.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 text-sm font-medium">
          <label htmlFor={`${headingId}-model`}>Модель</label>
          <select
            id={`${headingId}-model`}
            className={fieldClass}
            value={selection.model}
            onChange={(event) =>
              selectValue("model", event.currentTarget.value)
            }
          >
            {models[selection.provider].map((model) => (
              <option key={model}>{model}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0 text-sm font-medium">
          <label htmlFor={`${headingId}-connection`}>Метка подключения</label>
          <select
            id={`${headingId}-connection`}
            required
            className={fieldClass}
            value={selection.connectionId}
            onChange={(event) =>
              selectValue("connectionId", event.currentTarget.value)
            }
          >
            <option value="">Выберите подключение</option>
            {providerConnections.map(({ id, label, state }) => (
              <option key={id} value={id}>
                {label}
                {state === "revoked" ? " · отозвано" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:col-span-2">
          <button
            type="submit"
            disabled={
              !selection.subjectId ||
              selectedConnection?.state !== "active" ||
              saved
            }
            className={primaryClass}
          >
            Сохранить назначение
          </button>
          {saved && (
            <p
              role="status"
              className="text-xs font-medium text-muted-foreground"
            >
              Назначение сохранено
            </p>
          )}
        </div>
      </form>

      <section
        className="mt-6 border-t border-border pt-5"
        aria-label="Ключ подключения"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Icon variant="phosphor" name="key" size={20} /> Ключ подключения
          </h3>
          <button
            ref={addButtonRef}
            type="button"
            className={actionClass}
            onClick={() => {
              setRevokeConfirm(false);
              setCredentialMode("new");
            }}
          >
            Добавить ключ
          </button>
        </div>
        {selectedConnection ? (
          <div className="mt-3 rounded-xl border border-border bg-muted p-3.5">
            <p className="break-words text-sm font-semibold">
              {selectedConnection.label}
            </p>
            <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
              Аккаунт {selectedConnection.externalAccount} · версия{" "}
              {selectedConnection.version} ·{" "}
              {connectionStates[selectedConnection.state]}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                ref={replaceButtonRef}
                type="button"
                className={actionClass}
                onClick={() => {
                  setRevokeConfirm(false);
                  setCredentialMode("replace");
                }}
              >
                Заменить ключ
              </button>
              {selectedConnection.state !== "revoked" && (
                <button
                  ref={revokeButtonRef}
                  type="button"
                  className={actionClass}
                  onClick={() => {
                    setCredentialMode(undefined);
                    setRevokeConfirm(true);
                  }}
                >
                  Отозвать ключ
                </button>
              )}
            </div>
            {revokeConfirm && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm">
                  Новые вызовы по этому подключению остановятся.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    ref={revokeConfirmRef}
                    type="button"
                    className={primaryClass}
                    onClick={() => {
                      onRevoke(selectedConnection.id);
                      setRevokeConfirm(false);
                      replaceButtonRef.current?.focus();
                    }}
                  >
                    Подтвердить отзыв
                  </button>
                  <button
                    type="button"
                    className={actionClass}
                    onClick={() => {
                      setRevokeConfirm(false);
                      revokeButtonRef.current?.focus();
                    }}
                  >
                    Отменить
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Выберите или добавьте подключение для {selection.provider}.
          </p>
        )}
        {credentialMode && (
          <CredentialForm
            mode={credentialMode}
            connection={
              credentialMode === "replace" ? selectedConnection : undefined
            }
            provider={selection.provider}
            onCancel={closeCredential}
            onSave={(values) => {
              onSaveCredential(values);
              closeCredential();
            }}
          />
        )}
      </section>
    </section>
  );
}

function CredentialForm({
  provider,
  mode,
  connection,
  onSave,
  onCancel,
}: {
  provider: Provider;
  mode: "new" | "replace";
  connection?: IConnection;
  onSave: (values: ICredentialValues) => void;
  onCancel: () => void;
}) {
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const read = (name: string) => String(data.get(name) ?? "").trim();
    const secret = read("secret");
    const label = connection?.label ?? read("label");
    const externalAccount = connection?.externalAccount ?? read("account");
    if (!secret || !label || !externalAccount) return;
    onSave({
      provider,
      connectionId: connection?.id,
      label,
      externalAccount,
      secret,
    });
    form.reset();
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4"
    >
      <h4 className="text-sm font-semibold">
        {mode === "new"
          ? `Новый ключ ${provider}`
          : `Новая версия ключа · ${connection?.label}`}
      </h4>
      {mode === "new" && (
        <>
          <label className="text-sm font-medium">
            Метка ключа
            <input
              ref={firstField}
              className={fieldClass}
              name="label"
              required
              maxLength={50}
            />
          </label>
          <label className="text-sm font-medium">
            Внешний аккаунт
            <input
              className={fieldClass}
              name="account"
              required
              maxLength={60}
            />
          </label>
        </>
      )}
      <label className="text-sm font-medium">
        Секретный ключ
        <input
          ref={mode === "replace" ? firstField : undefined}
          className={fieldClass}
          name="secret"
          type="password"
          required
          minLength={8}
          maxLength={150}
          autoComplete="new-password"
          placeholder="Введите тестовый ключ"
        />
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Поле очистится после сохранения. Ключ нельзя посмотреть повторно.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryClass}>
          Сохранить ключ
        </button>
        <button type="button" onClick={onCancel} className={actionClass}>
          Отменить
        </button>
      </div>
    </form>
  );
}

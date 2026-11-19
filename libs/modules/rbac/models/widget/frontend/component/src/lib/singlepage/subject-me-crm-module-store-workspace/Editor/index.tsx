import { ArrowDown, ArrowUp, ListOrdered, Plus } from "lucide-react";
import { useState } from "react";
import type {
  IFunnelDefinition,
  IFunnelStage,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspaceOptions,
  TCrmWorkspaceCommand,
  TCrmWorkspaceCommandResult,
} from "@sps/rbac/models/subject/sdk/model";
import {
  fieldClass,
  iconButtonClass,
  primaryClass,
  secondaryClass,
} from "../primitives";
import { Field, TextField } from "./Fields";
import { StageEditor } from "./StageEditor";

const card = "rounded-xl border border-border bg-card p-4 sm:p-5";
const kinds: Record<TFunnelKind, string> = {
  consultation: "Консультация",
  "individual-service": "Индивидуальная услуга",
  "physical-order": "Физический заказ",
};

type TSave = Extract<TCrmWorkspaceCommand, { kind: "save" }>["draft"];

interface IEditorProps {
  storeId: string;
  initial?: ICrmWorkspaceFunnel;
  options: ICrmWorkspaceOptions;
  execute: (
    command: TCrmWorkspaceCommand,
  ) => Promise<TCrmWorkspaceCommandResult>;
  onPublished: (funnelId: string) => void;
}

function newStage(): IFunnelStage {
  return {
    id: crypto.randomUUID(),
    name: "Новый этап",
    instruction: "",
    actions: [],
  };
}

export function Editor({
  storeId,
  initial,
  options,
  execute,
  onPublished,
}: IEditorProps) {
  const [funnel, setFunnel] = useState(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<TFunnelKind>(
    initial?.kind ?? "consultation",
  );
  const [definition, setDefinition] = useState<IFunnelDefinition>(() => {
    const stage = newStage();
    return initial?.definition ?? { initialStageId: stage.id, stages: [stage] };
  });
  const [selectedId, setSelectedId] = useState(definition.stages[0].id);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selectedIndex = definition.stages.findIndex(
    (stage) => stage.id === selectedId,
  );
  const selected = definition.stages[selectedIndex];

  function patchStage(patch: Partial<IFunnelStage>) {
    setDefinition((value) => ({
      ...value,
      stages: value.stages.map((stage) =>
        stage.id === selectedId ? { ...stage, ...patch } : stage,
      ),
    }));
  }

  function reorder(offset: number) {
    const stages = [...definition.stages];
    const destination = selectedIndex + offset;
    if (destination < 0 || destination >= stages.length) return;
    [stages[destination], stages[selectedIndex]] = [
      stages[selectedIndex],
      stages[destination],
    ];
    setDefinition((value) => ({ ...value, stages }));
  }

  async function submit(publish: boolean) {
    setError("");
    setNotice("");
    const initialStageId = definition.stages.find(
      (stage) => !stage.archived,
    )?.id;
    if (!name.trim() || !initialStageId) {
      setError("Введите название воронки и добавьте действующий этап.");
      return;
    }
    if (
      publish &&
      (!definition.applicability?.trim() ||
        !definition.goal?.trim() ||
        definition.stages.some(
          (stage) =>
            !stage.archived &&
            (!stage.instruction.trim() ||
              !stage.evidenceInstruction?.trim() ||
              !stage.missingDataInstruction?.trim()),
        ))
    ) {
      setError(
        "Заполните цель, условия применения, инструкции и доказательства действующих этапов.",
      );
      return;
    }
    const draft: TSave = {
      storeId,
      funnelId: funnel?.id,
      expectedRevision: funnel?.revision,
      name,
      kind,
      definition: { ...definition, initialStageId },
    };
    setPending(true);
    try {
      const saved = await execute({ kind: "save", draft });
      if (saved.kind !== "save") return;
      setFunnel(saved.data);
      setNotice("Черновик сохранён.");
      if (!publish) return;
      const publication = await execute({
        kind: "publish",
        publication: {
          storeId,
          funnelId: saved.data.id,
          expectedRevision: saved.data.revision,
          operationKey: crypto.randomUUID(),
        },
      });
      if (publication.kind === "publish") {
        setFunnel({
          ...saved.data,
          publishedVersion: publication.data.version,
        });
        onPublished(saved.data.id);
        setNotice(
          `Версия ${publication.data.version} опубликована. Новые задачи получат её условия.`,
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Воронку не удалось сохранить.",
      );
    } finally {
      setPending(false);
    }
  }

  const funding = definition.workFunding;

  return (
    <section
      className="grid min-w-0 gap-4"
      aria-labelledby="crm-editor-title"
      aria-busy={pending}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="crm-editor-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Редактор воронки
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {funnel?.publishedVersion
              ? `Версия ${funnel.publishedVersion} опубликована`
              : "Новая воронка"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryClass}
            disabled={pending}
            onClick={() => void submit(false)}
          >
            Сохранить черновик
          </button>
          <button
            type="button"
            className={primaryClass}
            disabled={pending}
            onClick={() => void submit(true)}
          >
            Опубликовать версию
          </button>
        </div>
      </header>
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className={`${card} grid gap-3`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Название воронки" value={name} onChange={setName} />
          <Field label="Тип воронки">
            <select
              className={fieldClass}
              value={kind}
              disabled={Boolean(funnel?.id)}
              onChange={(event) =>
                setKind(event.currentTarget.value as TFunnelKind)
              }
            >
              {Object.entries(kinds).map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </Field>
          <TextField
            label="Когда применять"
            value={definition.applicability ?? ""}
            multiline
            onChange={(applicability) =>
              setDefinition({ ...definition, applicability })
            }
          />
          <TextField
            label="Цель воронки"
            value={definition.goal ?? ""}
            multiline
            onChange={(goal) => setDefinition({ ...definition, goal })}
          />
          {kind === "consultation" && funding?.payer === "store-owner" && (
            <TextField
              label="ID источника для фоновой индексации"
              value={definition.maintenanceSourceId ?? ""}
              onChange={(value) =>
                setDefinition({
                  ...definition,
                  maintenanceSourceId: value.trim() || undefined,
                })
              }
            />
          )}
        </div>
        <fieldset className="grid gap-3 border-t border-border pt-4">
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={Boolean(funding)}
              onChange={(event) =>
                setDefinition({
                  ...definition,
                  workFunding: event.currentTarget.checked
                    ? {
                        payer: "store-owner",
                        currencyId: options.currencies[0]?.id ?? "",
                        maxTaskAmount: "",
                        maxRunAmount: "",
                      }
                    : undefined,
                })
              }
            />{" "}
            Бюджет работы ИИ
          </label>
          {funding && (
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Кто оплачивает работу ИИ">
                <select
                  className={fieldClass}
                  value={funding.payer}
                  onChange={(event) =>
                    setDefinition({
                      ...definition,
                      workFunding: {
                        ...funding,
                        payer: event.currentTarget
                          .value as typeof funding.payer,
                      },
                    })
                  }
                >
                  <option value="store-owner">Владелец магазина</option>
                  <option value="customer">Клиент</option>
                </select>
              </Field>
              <Field label="Валюта бюджета">
                <select
                  className={fieldClass}
                  value={funding.currencyId}
                  onChange={(event) =>
                    setDefinition({
                      ...definition,
                      workFunding: {
                        ...funding,
                        currencyId: event.currentTarget.value,
                      },
                    })
                  }
                >
                  <option value="">Выберите валюту</option>
                  {options.currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.title}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField
                label="Лимит на задачу"
                value={funding.maxTaskAmount}
                onChange={(maxTaskAmount) =>
                  setDefinition({
                    ...definition,
                    workFunding: { ...funding, maxTaskAmount },
                  })
                }
              />
              <TextField
                label="Лимит на запуск"
                value={funding.maxRunAmount}
                onChange={(maxRunAmount) =>
                  setDefinition({
                    ...definition,
                    workFunding: { ...funding, maxRunAmount },
                  })
                }
              />
            </div>
          )}
        </fieldset>
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className={`${card} grid gap-2`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ListOrdered aria-hidden="true" className="size-4" /> Этапы
          </h3>
          {definition.stages.map((stage) => (
            <button
              type="button"
              key={stage.id}
              aria-pressed={stage.id === selectedId}
              className="min-h-10 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted aria-pressed:bg-accent aria-pressed:font-semibold"
              onClick={() => setSelectedId(stage.id)}
            >
              {stage.name || "Новый этап"}{" "}
              {stage.archived && (
                <span className="text-xs text-muted-foreground">· Архив</span>
              )}
            </button>
          ))}
          <button
            type="button"
            className={secondaryClass}
            onClick={() => {
              const stage = newStage();
              setDefinition({
                ...definition,
                stages: [...definition.stages, stage],
              });
              setSelectedId(stage.id);
            }}
          >
            <Plus aria-hidden="true" className="size-4" /> Добавить этап
          </button>
        </aside>
        <section className={`${card} grid min-w-0 gap-4`}>
          <header className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {selected.name || "Новый этап"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={iconButtonClass}
                aria-label="Переместить этап выше"
                disabled={selectedIndex === 0}
                onClick={() => reorder(-1)}
              >
                <ArrowUp aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                className={iconButtonClass}
                aria-label="Переместить этап ниже"
                disabled={selectedIndex === definition.stages.length - 1}
                onClick={() => reorder(1)}
              >
                <ArrowDown aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                className={secondaryClass}
                onClick={() => patchStage({ archived: !selected.archived })}
              >
                {selected.archived ? "Восстановить" : "Архивировать"}
              </button>
            </div>
          </header>
          <StageEditor
            kind={kind}
            key={selectedId}
            stage={selected}
            stages={definition.stages}
            options={options}
            onChange={patchStage}
          />
        </section>
      </div>
    </section>
  );
}

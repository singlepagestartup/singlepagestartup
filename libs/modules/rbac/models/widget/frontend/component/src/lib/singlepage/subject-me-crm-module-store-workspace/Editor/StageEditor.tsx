import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type {
  IFunnelAction,
  IFunnelStage,
  TEvidenceKind,
  TFunnelKind,
  TTaskOutcome,
  TWorkOperation,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceOptions } from "@sps/rbac/models/subject/sdk/model";
import { fieldClass, iconButtonClass, secondaryClass } from "../primitives";
import { evidenceLabels } from "../view-model";
import { Field, TextField } from "./Fields";
import { ResultPricing } from "./ResultPricing";

type TWaiting = NonNullable<IFunnelStage["waiting"]>;
const waitEvents: TWaiting["expectedEvent"][] = [
  "message",
  "result-accepted",
  "payment",
  "delivery",
  "file-access",
];
const actionKinds: TEvidenceKind[] = ["manual", "model-result", ...waitEvents];
const outcomes: Record<TTaskOutcome, string> = {
  completed: "Выполнено",
  "closed-without-result": "Закрыто без результата",
};
const settlementEvents = [
  ["run-completed", "Работа исполнителя завершена"],
  ["result-accepted", "Клиент принял результат"],
  ["payment-confirmed", "Платёж подтверждён"],
  ["delivery-confirmed", "Доставка подтверждена"],
];

const optionalWork: Array<{ operation: TWorkOperation; label: string }> = [
  { operation: "request-routing", label: "Распознать запрос через JEV" },
  { operation: "tool-selection", label: "Подобрать один инструмент" },
  { operation: "compression", label: "Сжать длинный диалог" },
  {
    operation: "knowledge-search",
    label: "Искать в материалах магазина по смыслу",
  },
  { operation: "vision", label: "Прочитать приложенное изображение" },
  { operation: "transcription", label: "Расшифровать приложенный WAV" },
];

function actionActor(evidence: TEvidenceKind): IFunnelAction["actors"] {
  if (evidence === "manual") return ["manager"];
  if (evidence === "model-result") return ["ai", "human"];
  if (evidence === "message") return ["system", "human", "ai"];
  return ["system"];
}

interface IStageEditorProps {
  stage: IFunnelStage;
  stages: IFunnelStage[];
  options: ICrmWorkspaceOptions;
  kind: TFunnelKind;
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function StageEditor({
  stage,
  stages,
  options,
  kind,
  onChange,
}: IStageEditorProps) {
  const [preview, setPreview] = useState("missing");
  const nextStages = stages.filter((item) => !item.archived);
  const selectedAction = stage.actions.find((action) => action.id === preview);
  const destination = selectedAction?.nextStageId
    ? nextStages.find((next) => next.id === selectedAction.nextStageId)?.name
    : selectedAction?.outcome && outcomes[selectedAction.outcome];
  const waiting = stage.waiting;
  const activeEvent = waiting?.expectedEvent ?? "";
  const reminders =
    waiting?.reminderSeconds.map((seconds) => seconds / 3600).join(", ") ?? "";

  function patchAction(id: string, patch: Partial<IFunnelAction>) {
    onChange({
      actions: stage.actions.map((action) =>
        action.id === id ? { ...action, ...patch } : action,
      ),
    });
  }

  function patchWaiting(patch: Partial<TWaiting>) {
    if (waiting) onChange({ waiting: { ...waiting, ...patch } });
  }

  return (
    <fieldset
      disabled={stage.archived}
      className="grid gap-5 disabled:opacity-65"
    >
      <TextField
        label="Название этапа"
        value={stage.name}
        required
        onChange={(name) => onChange({ name })}
      />
      <div className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Что делает исполнитель</h4>
        <Field label="Формат результата">
          <select
            className={fieldClass}
            value={stage.output ?? "chat"}
            onChange={(event) =>
              onChange({
                output: event.currentTarget.value as IFunnelStage["output"],
              })
            }
          >
            <option value="chat">Ответ в чате</option>
            <option value="pdf" disabled={kind !== "individual-service"}>
              PDF
            </option>
            <option value="image" disabled={kind !== "individual-service"}>
              Изображение
            </option>
          </select>
        </Field>
        <TextField
          label="Инструкция"
          value={stage.instruction}
          multiline
          onChange={(instruction) => onChange({ instruction })}
        />
        <CartOffers key={stage.id} initialValue={stage.cartOfferIds ?? []}
          onChange={(cartOfferIds) => onChange({ cartOfferIds })} />
        <fieldset className="grid gap-2 text-sm">
          <legend className="font-medium">Платные шаги исполнителя</legend>
          {optionalWork.map(({ operation, label }) => (
            <label key={operation} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={stage.operations?.includes(operation) ?? false}
                onChange={(event) => {
                  const selected = new Set(stage.operations);
                  if (event.currentTarget.checked) {
                    selected.add(operation);
                  } else {
                    selected.delete(operation);
                  }
                  onChange({ operations: [...selected] });
                }}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Достаточное доказательство"
            value={stage.evidenceInstruction ?? ""}
            multiline
            onChange={(evidenceInstruction) =>
              onChange({ evidenceInstruction })
            }
          />
          <TextField
            label="Действие при нехватке данных"
            value={stage.missingDataInstruction ?? ""}
            multiline
            onChange={(missingDataInstruction) =>
              onChange({ missingDataInstruction })
            }
          />
        </div>
      </div>
      <div className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Ожидание и напоминания</h4>
        <Field label="Событие ожидания">
          <select
            className={fieldClass}
            value={activeEvent}
            onChange={(event) => {
              const expectedEvent = event.currentTarget.value as
                TWaiting["expectedEvent"] | "";
              onChange({
                waiting: expectedEvent
                  ? {
                      deadlineSeconds: 86400,
                      reminderSeconds: [],
                      completionEvidence: [],
                      ...waiting,
                      expectedEvent,
                    }
                  : undefined,
              });
            }}
          >
            <option value="">Без ожидания</option>
            {waitEvents.map((kind) => (
              <option key={kind} value={kind}>
                {evidenceLabels[kind]}
              </option>
            ))}
          </select>
        </Field>
        {waiting && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Срок ожидания, ч">
              <input
                type="number"
                min={1}
                step={1}
                className={fieldClass}
                value={waiting.deadlineSeconds / 3600 || ""}
                onChange={(event) =>
                  patchWaiting({
                    deadlineSeconds: Number(event.currentTarget.value) * 3600,
                  })
                }
              />
            </Field>
            <ReminderField
              key={stage.id}
              initialValue={reminders}
              onChange={(value) =>
                patchWaiting({
                  reminderSeconds: value
                    ? value.split(",").map((part) => Number(part.trim()) * 3600)
                    : [],
                })
              }
            />
            <Field label="Исход при молчании">
              <select
                className={fieldClass}
                value={waiting.silenceOutcome ?? "closed-without-result"}
                onChange={(event) => {
                  const silenceOutcome = event.currentTarget
                    .value as TTaskOutcome;
                  const completionEvidence =
                    silenceOutcome === "completed"
                      ? ["model-result" as const]
                      : [];
                  patchWaiting({ silenceOutcome, completionEvidence });
                }}
              >
                <option value="closed-without-result">
                  Закрыто без результата
                </option>
                <option value="completed">
                  Выполнено при наличии результата
                </option>
              </select>
            </Field>
          </div>
        )}
      </div>
      <div className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Назначение и расчёт</h4>
        <TextField
          label="Условия расчёта"
          value={stage.settlementInstruction ?? ""}
          multiline
          onChange={(settlementInstruction) => onChange({ settlementInstruction })}
        />
        {kind === "individual-service" && (
          <ResultPricing stage={stage} currencies={options.currencies} onChange={onChange} />
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Ответственный">
            <select
              className={fieldClass}
              value={stage.defaultAssigneeSubjectId ?? ""}
              onChange={(event) =>
                onChange({
                  defaultAssigneeSubjectId:
                    event.currentTarget.value || undefined,
                })
              }
            >
              <option value="">Назначить вручную</option>
              {options.participants.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Плательщик этапа">
            <select
              className={fieldClass}
              value={stage.payerSubjectId ?? ""}
              onChange={(event) =>
                onChange({
                  payerSubjectId: event.currentTarget.value || undefined,
                })
              }
            >
              <option value="">По бюджету воронки</option>
              {options.payers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Событие расчёта">
            <select
              className={fieldClass}
              value={stage.settlementEvent ?? ""}
              onChange={(event) =>
                onChange({
                  settlementEvent: event.currentTarget.value || undefined,
                })
              }
            >
              <option value="">Выберите событие</option>
              {settlementEvents.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      <div className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Разрешённые операции</h4>
        {stage.actions.map((action) => (
          <div
            className="grid gap-3 rounded-lg border border-border p-3"
            key={action.id}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <TextField
                label="Название операции"
                value={action.name}
                onChange={(name) => patchAction(action.id, { name })}
              />
              <button
                type="button"
                className={iconButtonClass}
                aria-label={`Удалить операцию «${action.name}»`}
                onClick={() =>
                  onChange({
                    actions: stage.actions.filter(
                      (item) => item.id !== action.id,
                    ),
                  })
                }
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Основание операции">
                <select
                  className={fieldClass}
                  value={action.evidence[0]}
                  onChange={(event) => {
                    const evidence = event.currentTarget.value as TEvidenceKind;
                    patchAction(action.id, {
                      evidence: [evidence],
                      actors: actionActor(evidence),
                    });
                  }}
                >
                  {actionKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {evidenceLabels[kind]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Результат операции">
                <select
                  className={fieldClass}
                  value={action.nextStageId ?? action.outcome ?? ""}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    const outcome =
                      value in outcomes ? (value as TTaskOutcome) : undefined;
                    patchAction(action.id, {
                      outcome,
                      nextStageId: outcome ? undefined : value,
                    });
                  }}
                >
                  <optgroup label="Перейти к этапу">
                    {nextStages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Закрыть задачу">
                    {Object.entries(outcomes).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={`${secondaryClass} w-fit`}
          onClick={() =>
            onChange({
              actions: [
                ...stage.actions,
                {
                  id: `operation-${crypto.randomUUID()}`,
                  name: "Переместить вручную",
                  actors: ["manager"],
                  evidence: ["manual"],
                  nextStageId:
                    nextStages.find((item) => item.id !== stage.id)?.id ??
                    stage.id,
                },
              ],
            })
          }
        >
          <Plus aria-hidden="true" className="size-4" /> Добавить операцию
        </button>
      </div>
      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Предпросмотр этапа
        </summary>
        <div className="mt-3 grid gap-3">
          <Field label="Пример события">
            <select
              className={fieldClass}
              value={preview}
              onChange={(event) => setPreview(event.currentTarget.value)}
            >
              <option value="missing">Данных пока недостаточно</option>
              {stage.actions.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.name}
                </option>
              ))}
              {waiting && <option value="timeout">Истёк срок ожидания</option>}
            </select>
          </Field>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {stage.name} →{" "}
            {destination ??
              (preview === "timeout"
                ? outcomes[waiting?.silenceOutcome ?? "closed-without-result"]
                : stage.missingDataInstruction || "Ожидание данных")}
          </p>
        </div>
      </details>
    </fieldset>
  );
}

function CartOffers({ initialValue, onChange }: { initialValue: string[]; onChange: (ids: string[]) => void }) {
  const [value, setValue] = useState(initialValue.join(", "));
  return <Field label="Предложения для корзины">
    <textarea className={fieldClass} value={value} rows={2}
      placeholder="ID предложений магазина через запятую" onChange={(event) => {
        const text = event.currentTarget.value;
        setValue(text);
        onChange(text.split(",").map((id) => id.trim()).filter(Boolean));
      }} />
  </Field>;
}

function ReminderField({
  initialValue,
  onChange,
}: {
  initialValue: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <Field
      label="Напоминания через, ч"
      hint="Числа через запятую. Например, 24, 48."
    >
      <input
        className={fieldClass}
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          onChange(event.currentTarget.value);
        }}
      />
    </Field>
  );
}

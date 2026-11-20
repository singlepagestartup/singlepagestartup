import { Select } from "@sps/ui-adapter";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FUNNEL_STAGE_SKILL_LIMIT } from "@sps/crm/models/funnel/sdk/model";
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
import { assigneeOptionGroups, evidenceLabels } from "../view-model";
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
  const agent = options.participants.find(
    ({ id, kind }) => kind === "ai" && id === stage.defaultAssigneeSubjectId,
  );
  const skills = agent ? (options.skillsByAssignee?.[agent.id] ?? []) : [];
  const selectedSkillIds = stage.skillIds ?? [];
  const unavailableSkillIds = selectedSkillIds.filter(
    (id) => !skills.some((skill) => skill.id === id),
  );

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
      <Field
        label="Исполнитель этапа"
        hint="Назначается автоматически при переходе задачи на этот этап."
      >
        <Select
          ui="shadcn"
          className={fieldClass}
          value={stage.defaultAssigneeSubjectId ?? "manual"}
          onValueChange={(value) =>
            onChange({
              defaultAssigneeSubjectId: value === "manual" ? undefined : value,
              skillIds: undefined,
            })
          }
          disabled={stage.archived}
          options={[
            { value: "manual", label: "Назначить вручную" },
            ...assigneeOptionGroups(options.participants),
          ]}
        />
      </Field>
      <div className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Что делает исполнитель</h4>
        <Field label="Формат результата">
          <Select
            ui="shadcn"
            className={fieldClass}
            value={stage.output ?? "chat"}
            onValueChange={(selectedValue) => {
              const output = selectedValue as IFunnelStage["output"];
              onChange({
                output,
                imageBrief: output === "image" ? stage.imageBrief : undefined,
              });
            }}
            disabled={stage.archived}
            options={[
              { value: "chat", label: "Ответ в чате" },
              {
                value: "pdf",
                label: "PDF",
                disabled: kind !== "individual-service",
              },
              {
                value: "image",
                label: "Изображение",
                disabled: kind !== "individual-service",
              },
            ]}
          />
        </Field>
        {stage.output === "image" && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={stage.imageBrief === "marketplace-cover"}
              onChange={(event) =>
                onChange({
                  imageBrief: event.currentTarget.checked
                    ? "marketplace-cover"
                    : undefined,
                })
              }
            />
            Обложка товара по брифу
          </label>
        )}
        <TextField
          label="Инструкция"
          value={stage.instruction}
          multiline
          onChange={(instruction) => onChange({ instruction })}
        />
        <CartOffers
          key={stage.id}
          initialValue={stage.cartOfferIds ?? []}
          onChange={(cartOfferIds) => onChange({ cartOfferIds })}
        />
        {stage.imageBrief !== "marketplace-cover" && (
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
        )}
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
          <Select
            ui="shadcn"
            className={fieldClass}
            value={activeEvent || "none"}
            onValueChange={(selectedValue) => {
              const value = selectedValue === "none" ? "" : selectedValue;
              const expectedEvent = value as TWaiting["expectedEvent"] | "";
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
            disabled={stage.archived}
            options={[
              { value: "none", label: "Без ожидания" },
              ...waitEvents.map((kind) => ({
                value: kind,
                label: evidenceLabels[kind],
              })),
            ]}
          />
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
              <Select
                ui="shadcn"
                className={fieldClass}
                value={waiting.silenceOutcome ?? "closed-without-result"}
                onValueChange={(selectedValue) => {
                  const silenceOutcome = selectedValue as TTaskOutcome;
                  const completionEvidence =
                    silenceOutcome === "completed"
                      ? ["model-result" as const]
                      : [];
                  patchWaiting({ silenceOutcome, completionEvidence });
                }}
                disabled={stage.archived}
                options={[
                  {
                    value: "closed-without-result",
                    label: "Закрыто без результата",
                  },
                  {
                    value: "completed",
                    label: "Выполнено при наличии результата",
                  },
                ]}
              />
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
          onChange={(settlementInstruction) =>
            onChange({ settlementInstruction })
          }
        />
        {kind === "individual-service" && (
          <ResultPricing
            stage={stage}
            currencies={options.currencies}
            onChange={onChange}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Плательщик этапа">
            <Select
              ui="shadcn"
              className={fieldClass}
              value={stage.payerSubjectId ?? "funnel-budget"}
              onValueChange={(value) =>
                onChange({
                  payerSubjectId: value === "funnel-budget" ? undefined : value,
                })
              }
              disabled={stage.archived}
              options={[
                { value: "funnel-budget", label: "По бюджету воронки" },
                ...options.payers.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
              ]}
            />
          </Field>
          <Field label="Событие расчёта">
            <Select
              ui="shadcn"
              className={fieldClass}
              value={stage.settlementEvent ?? "none"}
              onValueChange={(value) =>
                onChange({
                  settlementEvent: value === "none" ? undefined : value,
                })
              }
              disabled={stage.archived}
              options={[
                { value: "none", label: "Выберите событие" },
                ...settlementEvents.map(([id, name]) => ({
                  value: id,
                  label: name,
                })),
              ]}
            />
          </Field>
        </div>
        {(agent || selectedSkillIds.length > 0) && (
          <fieldset className="grid gap-2 text-sm">
            <legend className="font-medium">Навыки на этапе</legend>
            {!skills.length && (
              <p className="text-muted-foreground">
                У исполнителя нет доступных навыков.
              </p>
            )}
            {skills.map(({ id, title }) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedSkillIds.includes(id)}
                  disabled={
                    selectedSkillIds.length >= FUNNEL_STAGE_SKILL_LIMIT &&
                    !selectedSkillIds.includes(id)
                  }
                  onChange={(event) =>
                    onChange({
                      skillIds: event.currentTarget.checked
                        ? [...selectedSkillIds, id]
                        : selectedSkillIds.filter(
                            (selectedId) => selectedId !== id,
                          ),
                    })
                  }
                />
                {title}
              </label>
            ))}
            {unavailableSkillIds.length > 0 && (
              <button
                type="button"
                className={`${secondaryClass} justify-self-start`}
                onClick={() =>
                  onChange({
                    skillIds: selectedSkillIds.filter(
                      (id) => !unavailableSkillIds.includes(id),
                    ),
                  })
                }
              >
                Убрать недоступные навыки
              </button>
            )}
          </fieldset>
        )}
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
                <Select
                  ui="shadcn"
                  className={fieldClass}
                  value={action.evidence[0]}
                  onValueChange={(selectedValue) => {
                    const evidence = selectedValue as TEvidenceKind;
                    patchAction(action.id, {
                      evidence: [evidence],
                      actors: actionActor(evidence),
                      deliveryStage:
                        evidence === "delivery"
                          ? action.deliveryStage
                          : undefined,
                    });
                  }}
                  disabled={stage.archived}
                  options={actionKinds.map((kind) => ({
                    value: kind,
                    label: evidenceLabels[kind],
                  }))}
                />
              </Field>
              {kind === "physical-order" &&
                action.evidence.includes("delivery") && (
                  <Field label="Этап исполнения заказа">
                    <Select
                      ui="shadcn"
                      className={fieldClass}
                      value={action.deliveryStage ?? "delivered"}
                      onValueChange={(selectedValue) =>
                        patchAction(action.id, {
                          deliveryStage:
                            selectedValue as IFunnelAction["deliveryStage"],
                        })
                      }
                      disabled={stage.archived}
                      options={[
                        { value: "preparing", label: "Сборка началась" },
                        {
                          value: "in-transit",
                          label: "Заказ передан перевозчику",
                        },
                        { value: "delivered", label: "Вручение подтверждено" },
                      ]}
                    />
                  </Field>
                )}
              <Field label="Результат операции">
                <Select
                  ui="shadcn"
                  className={fieldClass}
                  value={action.nextStageId ?? action.outcome ?? ""}
                  placeholder="Выберите этап или исход"
                  onValueChange={(value) => {
                    const outcome =
                      value in outcomes ? (value as TTaskOutcome) : undefined;
                    patchAction(action.id, {
                      outcome,
                      nextStageId: outcome ? undefined : value,
                    });
                  }}
                  disabled={stage.archived}
                  options={[
                    {
                      label: "Перейти к этапу",
                      options: nextStages.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })),
                    },
                    {
                      label: "Закрыть задачу",
                      options: Object.entries(outcomes).map(([id, name]) => ({
                        value: id,
                        label: name,
                      })),
                    },
                  ]}
                />
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
            <Select
              ui="shadcn"
              className={fieldClass}
              value={preview}
              onValueChange={setPreview}
              disabled={stage.archived}
              options={[
                { value: "missing", label: "Данных пока недостаточно" },
                ...stage.actions.map((action) => ({
                  value: action.id,
                  label: action.name,
                })),
                ...(waiting
                  ? [{ value: "timeout", label: "Истёк срок ожидания" }]
                  : []),
              ]}
            />
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

function CartOffers({
  initialValue,
  onChange,
}: {
  initialValue: string[];
  onChange: (ids: string[]) => void;
}) {
  const [value, setValue] = useState(initialValue.join(", "));
  return (
    <Field label="Предложения для корзины">
      <textarea
        className={fieldClass}
        value={value}
        rows={2}
        placeholder="ID предложений магазина через запятую"
        onChange={(event) => {
          const text = event.currentTarget.value;
          setValue(text);
          onChange(
            text
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
          );
        }}
      />
    </Field>
  );
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

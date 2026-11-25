import { OpenAIWorkModelPicker } from "@sps/ui-adapter/openai-work-model-picker";
import { Check } from "lucide-react";
import { useId } from "react";
import { fieldClass, secondaryClass } from "../../../shared/workflow-ui";
import {
  workflowEventLabels,
  workflowMaterialOptions,
  type IWorkflowTransition,
  type TWorkflowMaterial,
  type WorkflowEvent,
  type WorkflowStage,
} from "../../../shared/workflows";
import type { IComponentProps } from "./interface";
import { Field } from "./Fields";
import { ResultPricing } from "./ResultPricing";

export function EventOptions({
  emptyLabel,
  exclude,
}: {
  emptyLabel: string;
  exclude?: WorkflowEvent;
}) {
  return (
    <>
      <option value="none">{emptyLabel}</option>
      {(Object.entries(workflowEventLabels) as [WorkflowEvent, string][])
        .filter(([value]) => value !== "none" && value !== exclude)
        .map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
    </>
  );
}

interface StageFieldsProps extends Pick<IComponentProps, "people" | "payers"> {
  stage: WorkflowStage;
  stages: WorkflowStage[];
  newEmployeeHref: string;
  language: string;
  onChange: (change: Partial<WorkflowStage>) => void;
}

export function StageFields({
  stage,
  stages,
  people,
  payers,
  newEmployeeHref,
  language,
  onChange,
}: StageFieldsProps) {
  const modelLabel = "Модель OpenAI";
  const autoModelHint =
    "В режиме «Авто» применяется выбор клиента, если он доступен.";
  const russian = language === "ru";
  const materialsLanguage = russian ? "ru" : "en";
  const materialsId = useId();
  const agent = people.find(
    ({ id, kind }) => id === stage.assignee && kind === "agent",
  );
  const materials = stage.materials ?? [];
  const transitions = stage.transitions ?? [];
  const nextStages = stages.filter(
    (item) => item.id !== stage.id && !item.archived,
  );

  function patchTransition(id: string, patch: Partial<IWorkflowTransition>) {
    onChange({
      transitions: transitions.map((transition) =>
        transition.id === id ? { ...transition, ...patch } : transition,
      ),
    });
  }

  return (
    <fieldset
      disabled={stage.archived}
      className="grid gap-6 disabled:opacity-65"
    >
      <Field label="Название этапа">
        <input
          className={fieldClass}
          value={stage.title}
          onChange={(event) => onChange({ title: event.currentTarget.value })}
          placeholder="На согласовании"
        />
      </Field>
      <Field
        label="Исполнитель этапа"
        hint="Назначается автоматически при переходе задачи на этот этап."
      >
        <select
          className={fieldClass}
          value={stage.assignee}
          onChange={(event) =>
            onChange({ assignee: event.currentTarget.value })
          }
        >
          <option value="">Выберите сотрудника</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </Field>
      {!people.length && (
        <a
          href={newEmployeeHref}
          className="w-fit text-sm font-medium underline underline-offset-4"
        >
          Добавить сотрудника
        </a>
      )}
      <section className="grid gap-3.5 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Что делает исполнитель</h4>
        <Field label="Формат результата">
          <select
            className={fieldClass}
            value={stage.output ?? "chat"}
            onChange={(event) => {
              const output = event.currentTarget
                .value as WorkflowStage["output"];
              onChange({
                output,
                provider:
                  (output === "image") === (stage.output === "image")
                    ? stage.provider
                    : undefined,
                imageBrief: output === "image" ? stage.imageBrief : undefined,
                imageBriefAutoGenerate:
                  output === "image" ? stage.imageBriefAutoGenerate : undefined,
              });
            }}
          >
            <option value="chat">Ответ в чате</option>
            <option value="pdf">PDF</option>
            <option value="image">Изображение</option>
          </select>
        </Field>
        <Field
          label={modelLabel}
          hint={stage.provider ? undefined : autoModelHint}
        >
          <OpenAIWorkModelPicker
            kind={stage.output === "image" ? "image" : "text"}
            language="ru"
            modelLabel={modelLabel}
            useStageTextDefault={stage.output !== "image"}
            value={stage.provider}
            disabled={stage.archived}
            onChange={(provider) => onChange({ provider })}
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
                  imageBriefAutoGenerate: undefined,
                })
              }
            />
            Обложка товара по брифу
          </label>
        )}
        {stage.imageBrief === "marketplace-cover" && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={stage.imageBriefAutoGenerate === true}
              onChange={(event) =>
                onChange({
                  imageBriefAutoGenerate:
                    event.currentTarget.checked || undefined,
                })
              }
            />
            Начинать генерацию, когда все материалы получены
          </label>
        )}
        <Field
          label={
            russian
              ? "Назначение изображений для обложки"
              : "How to use cover images"
          }
          hint={
            russian
              ? "Применяется к изображениям, которые покупатель отправит на этом этапе. Референс задаёт оформление обложки."
              : "Applies to images the customer sends during this stage. The design reference guides the look of the cover."
          }
        >
          <select
            className={fieldClass}
            value={stage.coverAttachmentRole ?? "default"}
            onChange={({ currentTarget: { value } }) =>
              onChange({
                coverAttachmentRole:
                  value === "product-photo" || value === "style-reference"
                    ? value
                    : undefined,
              })
            }
          >
            <option value="default">
              {russian
                ? "По общим правилам"
                : "Use standard attachment handling"}
            </option>
            <option value="product-photo">
              {russian ? "Фото товара" : "Product photo"}
            </option>
            <option value="style-reference">
              {russian ? "Референс оформления" : "Design reference"}
            </option>
          </select>
        </Field>
        <Field label="Инструкция">
          <textarea
            className={`${fieldClass} min-h-24 leading-6`}
            value={stage.instruction}
            onChange={(event) =>
              onChange({ instruction: event.currentTarget.value })
            }
            placeholder="Покажи превью и узнай, какую версию клиент принимает."
          />
        </Field>
        {agent && stage.imageBrief !== "marketplace-cover" && (
          <fieldset
            lang={materialsLanguage}
            aria-describedby={`${materialsId}-hint`}
            className="grid gap-3 text-sm"
          >
            <legend className="font-medium">
              {russian ? "Обработка материалов" : "Material processing"}
            </legend>
            <p
              id={`${materialsId}-hint`}
              className="text-sm text-muted-foreground"
            >
              {russian
                ? "Дополнительные операции перед ответом ИИ. Если снять все флажки, они пропускаются. Расходы считаются по фактическому использованию модели и входят в лимиты сообщения и этапа."
                : "These are optional steps before an AI reply. Clear all checkboxes to skip them. Charges are based on actual model usage and count toward both the message and stage limits."}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                Object.keys(workflowMaterialOptions) as TWorkflowMaterial[]
              ).map((operation) => {
                const id = `${materialsId}-${operation}`;
                const { label, description } =
                  workflowMaterialOptions[operation][materialsLanguage];
                return (
                  <div
                    key={operation}
                    className="rounded-lg border border-border p-3"
                  >
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-3 text-sm font-medium"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        aria-describedby={`${id}-description`}
                        className="peer sr-only"
                        checked={materials.includes(operation)}
                        onChange={(event) =>
                          onChange({
                            materials: event.currentTarget.checked
                              ? [...materials, operation]
                              : materials.filter((item) => item !== operation),
                          })
                        }
                      />
                      <span
                        aria-hidden="true"
                        className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-foreground/60 text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed"
                      >
                        <Check className="size-4" />
                      </span>
                      {label}
                    </label>
                    <p
                      id={`${id}-description`}
                      className="mt-1 pl-8 text-xs leading-5 text-muted-foreground"
                    >
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}
        <div className="grid gap-3.5 lg:grid-cols-2">
          <Field label="Достаточное доказательство">
            <textarea
              className={`${fieldClass} min-h-20 leading-6`}
              value={stage.evidence}
              onChange={(event) =>
                onChange({ evidence: event.currentTarget.value })
              }
            />
          </Field>
          <Field label="Действие при нехватке данных">
            <textarea
              className={`${fieldClass} min-h-20 leading-6`}
              value={stage.missingData}
              onChange={(event) =>
                onChange({ missingData: event.currentTarget.value })
              }
            />
          </Field>
        </div>
      </section>
      <section className="grid gap-3.5 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Ожидание и напоминания</h4>
        <Field label="Событие ожидания">
          <select
            className={fieldClass}
            value={stage.waitFor}
            onChange={(event) =>
              onChange({ waitFor: event.currentTarget.value as WorkflowEvent })
            }
          >
            <EventOptions emptyLabel="Без ожидания" exclude="run-completed" />
          </select>
        </Field>
        {stage.waitFor !== "none" && (
          <div className="grid gap-3.5 lg:grid-cols-3">
            <Field label="Срок ожидания, ч">
              <input
                className={fieldClass}
                value={stage.waitHours || ""}
                type="number"
                min={1}
                step={1}
                onChange={(event) =>
                  onChange({ waitHours: Number(event.currentTarget.value) })
                }
              />
            </Field>
            <Field
              label="Напоминания через, ч"
              hint="Через запятую. Например, 24, 48."
            >
              <input
                className={fieldClass}
                value={stage.reminders}
                onChange={(event) =>
                  onChange({ reminders: event.currentTarget.value })
                }
              />
            </Field>
            <Field label="Исход при молчании">
              <select
                className={fieldClass}
                value={stage.silenceOutcome}
                onChange={(event) =>
                  onChange({
                    silenceOutcome: event.currentTarget
                      .value as WorkflowStage["silenceOutcome"],
                  })
                }
              >
                <option value="">Выберите исход</option>
                <option value="completed">
                  Выполнено при наличии результата
                </option>
                <option value="closed">Закрыто без результата</option>
              </select>
            </Field>
          </div>
        )}
      </section>
      {agent && (
        <fieldset className="grid gap-3 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Оплата работы</legend>
          <Field label="Кто оплачивает этап">
            <select
              className={fieldClass}
              value={stage.payer}
              onChange={(event) =>
                onChange({ payer: event.currentTarget.value })
              }
            >
              <option value="">Выберите владельца магазина</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="На этап в одной задаче, Token">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={stage.maxStageAmount ?? ""}
                onChange={(event) =>
                  onChange({ maxStageAmount: event.currentTarget.value })
                }
              />
            </Field>
            <Field label="На одно сообщение, Token">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={stage.maxRunAmount ?? ""}
                onChange={(event) =>
                  onChange({ maxRunAmount: event.currentTarget.value })
                }
              />
            </Field>
          </div>
        </fieldset>
      )}
      {(stage.output === "image" || stage.output === "pdf") && (
        <ResultPricing stage={stage} onChange={onChange} />
      )}
      <section className="grid gap-3 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Переходы между этапами</h4>
        {transitions.map((transition) => (
          <div
            key={transition.id}
            className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
          >
            <Field label="Событие">
              <select
                className={fieldClass}
                value={transition.event}
                onChange={(event) =>
                  patchTransition(transition.id, {
                    event: event.currentTarget
                      .value as IWorkflowTransition["event"],
                  })
                }
              >
                <option value="manual">Запись менеджера</option>
                {Object.entries(workflowEventLabels)
                  .filter(([value]) => value !== "none")
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Следующий этап или исход">
              <select
                className={fieldClass}
                value={transition.destination}
                onChange={(event) =>
                  patchTransition(transition.id, {
                    destination: event.currentTarget.value,
                  })
                }
              >
                <optgroup label="Перейти к этапу">
                  {nextStages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Закрыть задачу">
                  <option value="completed">Выполнено</option>
                  <option value="closed">Закрыто без результата</option>
                </optgroup>
              </select>
            </Field>
            <button
              type="button"
              className={`${secondaryClass} w-fit`}
              onClick={() =>
                onChange({
                  transitions: transitions.filter(
                    ({ id }) => id !== transition.id,
                  ),
                })
              }
            >
              Удалить переход
            </button>
          </div>
        ))}
        <button
          type="button"
          className={`${secondaryClass} w-fit`}
          onClick={() =>
            onChange({
              transitions: [
                ...transitions,
                {
                  id: crypto.randomUUID(),
                  event: "manual",
                  destination: nextStages[0]?.id ?? "completed",
                },
              ],
            })
          }
        >
          Добавить переход
        </button>
      </section>
    </fieldset>
  );
}

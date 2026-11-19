import { fieldClass } from "../../../shared/workflow-ui";
import {
  workflowEventLabels,
  workflowOperationLabels,
  type WorkflowEvent,
  type WorkflowOperation,
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
  onChange: (change: Partial<WorkflowStage>) => void;
}

export function StageFields({
  stage,
  people,
  payers,
  onChange,
}: StageFieldsProps) {
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
                imageBrief: output === "image" ? stage.imageBrief : undefined,
              });
            }}
          >
            <option value="chat">Ответ в чате</option>
            <option value="pdf">PDF</option>
            <option value="image">Изображение</option>
          </select>
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
      <section className="grid gap-3.5 border-t border-border pt-5">
        <h4 className="text-sm font-semibold">Назначение и расчёт</h4>
        <Field label="Условия расчёта">
          <textarea
            className={`${fieldClass} min-h-20 leading-6`}
            value={stage.settlementInstruction ?? ""}
            onChange={(event) =>
              onChange({ settlementInstruction: event.currentTarget.value })
            }
          />
        </Field>
        <ResultPricing stage={stage} onChange={onChange} />
        <fieldset className="grid gap-1.5 text-sm">
          <legend className="mb-1 font-medium">Разрешённые операции</legend>
          <div className="flex flex-wrap gap-2">
            {(
              Object.entries(workflowOperationLabels) as [
                WorkflowOperation,
                string,
              ][]
            ).map(([operation, label]) => (
              <label
                key={operation}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 has-checked:border-ring has-checked:bg-accent"
              >
                <input
                  className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  type="checkbox"
                  checked={stage.operations.includes(operation)}
                  onChange={(event) =>
                    onChange({
                      operations: event.currentTarget.checked
                        ? [...stage.operations, operation]
                        : stage.operations.filter(
                            (value) => value !== operation,
                          ),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3.5 lg:grid-cols-3">
          <Field label="Ответственный">
            <select
              className={fieldClass}
              value={stage.assignee}
              onChange={(event) =>
                onChange({ assignee: event.currentTarget.value })
              }
            >
              <option value="">Выберите исполнителя</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Плательщик">
            <select
              className={fieldClass}
              value={stage.payer}
              onChange={(event) =>
                onChange({ payer: event.currentTarget.value })
              }
            >
              <option value="">Выберите плательщика</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Событие расчёта">
            <select
              className={fieldClass}
              value={stage.settlementEvent}
              onChange={(event) =>
                onChange({
                  settlementEvent: event.currentTarget.value as WorkflowEvent,
                })
              }
            >
              <EventOptions emptyLabel="Выберите событие" />
            </select>
          </Field>
        </div>
      </section>
    </fieldset>
  );
}

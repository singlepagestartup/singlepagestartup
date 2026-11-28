import Link from "next/link";
import { Button, Checkbox, settingsFormStyles } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { OpenAIWorkModelPicker } from "@sps/ui-adapter/openai-work-model-picker";
import { Save, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { FUNNEL_STAGE_SKILL_LIMIT } from "@sps/crm/models/funnel/sdk/model";
import type {
  IFunnelStage,
  IWorkFunding,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceOptions } from "@sps/rbac/models/subject/sdk/model";
import { assigneeOptionGroups } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import {
  Field,
  TextField,
} from "../../../../../subject-me-crm-module-store-workspace/Fields";
import { StageFunding } from "./StageFunding";
import { OrderAction } from "./OrderAction";

type TWaiting = NonNullable<IFunnelStage["waiting"]>;
interface IStageEditorProps {
  stage: IFunnelStage;
  options: ICrmWorkspaceOptions;
  legacyFunding?: IWorkFunding;
  maintenance: boolean;
  employeesUrl: string;
  kind: TFunnelKind;
  language: string;
  canSave: boolean;
  canRemove: boolean;
  onSave?: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function StageEditor({
  stage,
  options,
  legacyFunding,
  maintenance,
  employeesUrl,
  kind,
  language,
  canSave,
  canRemove,
  onSave,
  onRemove,
  onChange,
}: IStageEditorProps) {
  const russian = language === "ru";
  const removeLabel = russian ? "Удалить этап" : "Delete stage";
  const modelLabel = russian ? "Используемая модель" : "Model in use";
  const workTokens = stage.resultPricing?.kind === "work-tokens";
  const usesAstraByDefault =
    stage.output !== "image" &&
    (Boolean(stage.workFunding) || legacyFunding?.payer !== "customer");
  const autoModelHint = russian
    ? "В режиме «Авто» применяется выбор клиента, если он доступен."
    : "Auto uses the customer's selection when available.";
  const reminderId = useId();
  const waitsForAcceptance = stage.actions.some(
    (action) =>
      action.actors.includes("system") &&
      action.evidence.includes("result-accepted"),
  );
  const waiting = stage.waiting;
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

  function patchWaiting(patch: Partial<TWaiting>) {
    if (waiting) onChange({ waiting: { ...waiting, ...patch } });
  }

  return (
    <>
      <div
        role="group"
        aria-label={russian ? "Действия с этапом" : "Stage actions"}
        className="flex flex-wrap justify-end gap-2"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={removeLabel}
          title={removeLabel}
          className="size-11 shrink-0 cursor-pointer rounded-xl border-border bg-card text-muted-foreground hover:border-destructive hover:bg-destructive-surface hover:text-destructive focus-visible:border-destructive focus-visible:bg-destructive-surface focus-visible:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
        {onSave && (
          <Button
            type="button"
            className={settingsFormStyles.primary}
            disabled={!canSave}
            onClick={onSave}
          >
            <Save aria-hidden="true" className="size-4" />
            {russian ? "Сохранить этап" : "Save stage"}
          </Button>
        )}
      </div>
      {!canRemove && onSave && (
        <p className="text-sm text-muted-foreground">
          {russian
            ? "Чтобы удалить последний действующий этап, сначала добавьте и сохраните другой."
            : "Add and save another active stage before deleting this one."}
        </p>
      )}
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
          label={russian ? "Исполнитель этапа" : "Stage employee"}
          hint={
            stage.behavior === "ecommerce-module-order-payment"
              ? russian
                ? "Можно сохранить текущее назначение или выбрать сотрудника для вопросов об оплате. ИИ-сотрудник видит статус платежа и отвечает по тарифу этого этапа."
                : "Keep the current assignment or choose an employee for payment questions. An AI employee can see the payment status and answers at this stage’s reply rate."
              : russian
                ? "Назначается автоматически при переходе задачи на этот этап."
                : "Assigned when the task enters this stage."
          }
        >
          <Select
            ui="shadcn"
            className={settingsFormStyles.field}
            value={
              stage.defaultAssigneeSubjectId ??
              (stage.behavior === "ecommerce-module-order-payment"
                ? "current"
                : "")
            }
            placeholder={russian ? "Выберите сотрудника" : "Choose an employee"}
            search={{
              placeholder: russian ? "Поиск исполнителя" : "Search employees",
              empty: russian
                ? "Исполнитель не найден."
                : "No matching employee.",
            }}
            onValueChange={(value) =>
              onChange({
                defaultAssigneeSubjectId:
                  value === "current" ? undefined : value,
                skillIds: undefined,
                ...(stage.behavior === "ecommerce-module-order-payment" &&
                  !options.participants.some(
                    (person) => person.id === value && person.kind === "ai",
                  ) && {
                    workFunding: undefined,
                    provider: undefined,
                  }),
              })
            }
            disabled={stage.archived}
            options={
              stage.behavior === "ecommerce-module-order-payment"
                ? [
                    {
                      value: "current",
                      label: russian
                        ? "По текущему назначению"
                        : "Keep the current assignment",
                    },
                    ...assigneeOptionGroups(options.participants),
                  ]
                : assigneeOptionGroups(options.participants)
            }
          />
        </Field>
        {options.participants.length === 0 && options.canManageEmployees && (
          <Link
            className="text-sm font-medium underline"
            href={`${employeesUrl}/new`}
          >
            Добавить сотрудника
          </Link>
        )}
        <section className="grid gap-4 border-t border-border pt-5">
          <h2 className={settingsFormStyles.title}>Что делает исполнитель</h2>
          {!stage.behavior && (
            <Field
              label={russian ? "Формат результата" : "Result format"}
              hint={
                workTokens
                  ? russian
                    ? "Результат этого этапа с оплатой в Token выдаётся в PDF."
                    : "This stage delivers a PDF under its Token payment terms."
                  : undefined
              }
            >
              <Select
                ui="shadcn"
                className={settingsFormStyles.field}
                value={stage.output ?? "chat"}
                onValueChange={(selectedValue) => {
                  const output = selectedValue as IFunnelStage["output"];
                  onChange({
                    output,
                    provider:
                      (output === "image") === (stage.output === "image")
                        ? stage.provider
                        : undefined,
                  });
                }}
                disabled={stage.archived || workTokens}
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
          )}
          {!workTokens &&
            (stage.output === "image" || stage.output === "pdf") && (
              <p className="text-sm text-muted-foreground">
                {russian
                  ? "Для предпросмотра в чате сервер создаёт копию с водяным знаком."
                  : "The server creates a watermarked copy for preview in the chat."}
              </p>
            )}
          {(!stage.behavior || agent) && (
            <Field
              label={modelLabel}
              hint={stage.provider ? undefined : autoModelHint}
            >
              <OpenAIWorkModelPicker
                kind={stage.output === "image" ? "image" : "text"}
                language={language}
                modelLabel={modelLabel}
                useStageTextDefault={usesAstraByDefault}
                value={stage.provider}
                disabled={stage.archived}
                onChange={(provider) => onChange({ provider })}
              />
            </Field>
          )}
          <TextField
            label="Инструкция"
            value={stage.instruction}
            multiline
            onChange={(instruction) => onChange({ instruction })}
          />
          {!stage.behavior &&
            (waitsForAcceptance ? (
              <p className="text-sm text-muted-foreground">
                Этап завершится, когда клиент примет предпросмотр в чате заказа.
              </p>
            ) : (
              <div className="grid gap-4">
                <TextField
                  label="Когда переходить к следующему этапу"
                  hint="Опишите условие, которое исполнитель проверит по переписке."
                  value={stage.evidenceInstruction ?? ""}
                  multiline
                  onChange={(evidenceInstruction) =>
                    onChange({ evidenceInstruction })
                  }
                />
                <TextField
                  label="Что делать, пока условие не выполнено"
                  value={stage.missingDataInstruction ?? ""}
                  multiline
                  onChange={(missingDataInstruction) =>
                    onChange({ missingDataInstruction })
                  }
                />
              </div>
            ))}
        </section>
        {!stage.behavior && (
          <section className="grid gap-4 border-t border-border pt-5">
            <h2 className={settingsFormStyles.title}>Напоминания клиенту</h2>
            <div className="flex items-center gap-2">
              <Checkbox
                id={reminderId}
                className="size-5 border-input"
                disabled={stage.archived}
                checked={Boolean(waiting)}
                onCheckedChange={(checked) =>
                  onChange({
                    waiting:
                      checked === true
                        ? {
                            expectedEvent: "message",
                            deadlineSeconds: 86400,
                            reminderSeconds: [43200],
                            completionEvidence: [],
                            silenceOutcome: "closed-without-result",
                          }
                        : undefined,
                  })
                }
              />
              <label
                htmlFor={reminderId}
                className="cursor-pointer text-sm font-medium"
              >
                Напоминать, если клиент не ответил
              </label>
            </div>
            <fieldset
              disabled={!waiting}
              className="grid gap-3 disabled:opacity-60 sm:grid-cols-3"
            >
              <Field label="Срок ожидания, ч">
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={settingsFormStyles.field}
                  value={waiting ? waiting.deadlineSeconds / 3600 || "" : ""}
                  onChange={(event) =>
                    patchWaiting({
                      deadlineSeconds: Number(event.currentTarget.value) * 3600,
                    })
                  }
                />
              </Field>
              <ReminderField
                key={waiting ? "enabled" : "disabled"}
                initialValue={reminders}
                onChange={(value) =>
                  patchWaiting({
                    reminderSeconds: value
                      ? value
                          .split(",")
                          .map((part) => Number(part.trim()) * 3600)
                      : [],
                  })
                }
              />
              <div className="grid content-start gap-3 text-sm">
                <span className="font-semibold">Исход при молчании</span>
                <span>Закрыто без результата</span>
              </div>
            </fieldset>
          </section>
        )}
        {!maintenance && agent && (
          <section className="grid gap-4 border-t border-border pt-5">
            <h2 className={settingsFormStyles.title}>Оплата</h2>
            <StageFunding
              stage={stage}
              legacyFunding={legacyFunding}
              options={options}
              onChange={onChange}
            />
          </section>
        )}
        {!maintenance && kind !== "consultation" && (
          <section className="grid gap-4 border-t border-border pt-5">
            <h2 className={settingsFormStyles.title}>Заказ</h2>
            <OrderAction
              stage={stage}
              kind={kind}
              language={language}
              onChange={onChange}
            />
          </section>
        )}
        <div className="grid gap-3">
          {!stage.behavior &&
            (skills.length > 0 || selectedSkillIds.length > 0) && (
              <fieldset className="grid gap-2 text-sm">
                <legend className={settingsFormStyles.title}>
                  Навыки на этапе
                </legend>
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
                    className={`${settingsFormStyles.secondary} justify-self-start`}
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
      </fieldset>
    </>
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
        className={settingsFormStyles.field}
        value={value}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          onChange(event.currentTarget.value);
        }}
      />
    </Field>
  );
}

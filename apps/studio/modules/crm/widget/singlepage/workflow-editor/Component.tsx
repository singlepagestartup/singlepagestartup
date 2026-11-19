import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  ListOrdered,
  Plus,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  fieldClass,
  iconButtonClass,
  primaryClass,
  secondaryClass,
} from "../../../shared/workflow-ui";
import {
  newStage,
  timestampLabel,
  type WorkflowStage,
} from "../../../shared/workflows";
import type { IComponentProps } from "./interface";
import { Field, StageFields } from "./StageFields";
import { Preview } from "./Preview";
import { draftErrors, stageErrors } from "./validation";

const editorCard = "rounded-xl border border-border bg-card p-4 sm:p-5";

export function Component({
  initialDraft,
  currentRelease,
  people,
  payers,
  onSave,
  onPublish,
}: IComponentProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [selectedId, setSelectedId] = useState(initialDraft.stages[0]?.id);
  const [message, setMessage] = useState("");
  const [validate, setValidate] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(currentRelease?.version);
  const [isDirty, setIsDirty] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const selectedIndex = draft.stages.findIndex(
    (stage) => stage.id === selectedId,
  );
  const selected = draft.stages[selectedIndex];
  const errors = validate ? draftErrors(draft) : [];
  const invalidStages = validate
    ? draft.stages
        .filter((stage) => !stage.archived)
        .map((stage) => ({ stage, errors: stageErrors(stage) }))
        .filter((item) => item.errors.length)
    : [];

  function changeDraft(change: Partial<typeof draft>) {
    setDraft((current) => ({ ...current, ...change }));
    setIsDirty(true);
    setMessage("");
  }

  function changeStage(change: Partial<WorkflowStage>) {
    changeDraft({
      stages: draft.stages.map((stage) =>
        stage.id === selectedId ? { ...stage, ...change } : stage,
      ),
    });
  }

  function addStage() {
    const id = `stage-${Date.now().toString(36)}-${nextId.current++}`;
    changeDraft({ stages: [...draft.stages, newStage(id)] });
    setSelectedId(id);
  }

  function reorderStage(offset: -1 | 1) {
    const newIndex = selectedIndex + offset;
    if (!selected || newIndex < 0 || newIndex >= draft.stages.length) return;
    const reordered = [...draft.stages];
    [reordered[selectedIndex], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[selectedIndex],
    ];
    changeDraft({ stages: reordered });
  }

  function saveDraft() {
    onSave?.(draft);
    setIsDirty(false);
    setMessage("Черновик сохранён.");
  }

  function publishDraft() {
    if (
      draftErrors(draft).length ||
      draft.stages.some((stage) => !stage.archived && stageErrors(stage).length)
    ) {
      setValidate(true);
      setMessage("");
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    const version = (previewVersion ?? 0) + 1;
    onPublish?.(draft);
    setPreviewVersion(version);
    setValidate(false);
    setIsDirty(false);
    setMessage(
      `Версия ${version} опубликована. Новые задачи получат её условия.`,
    );
  }

  return (
    <section
      className="grid min-w-0 gap-4"
      data-ds-block="crm.widget.workflow-editor"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="widget"
      data-variant="workflow-editor"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="font-primary text-2xl font-semibold tracking-tight">
            Редактор воронки
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {previewVersion
              ? `Версия ${previewVersion} опубликована`
              : "Новая воронка"}
            {currentRelease?.publishedAt &&
            previewVersion === currentRelease.version
              ? ` · ${timestampLabel(currentRelease.publishedAt)}`
              : ""}
            {isDirty ? " · Есть изменения" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={secondaryClass} type="button" onClick={saveDraft}>
            Сохранить черновик
          </button>
          <button className={primaryClass} type="button" onClick={publishDraft}>
            Опубликовать версию
          </button>
        </div>
      </header>
      {message && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-950"
        >
          <Check aria-hidden="true" className="size-4 shrink-0" /> {message}
        </div>
      )}
      {(errors.length > 0 || invalidStages.length > 0) && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />{" "}
            Заполните поля перед публикацией
          </p>
          {errors.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {invalidStages.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {invalidStages.map(({ stage, errors }) => (
                <li key={stage.id}>
                  <button
                    className="mr-1 min-h-8 font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                    type="button"
                    onClick={() => {
                      setSelectedId(stage.id);
                      window.requestAnimationFrame(() =>
                        document.getElementById("crm-stage-editor")?.focus(),
                      );
                    }}
                  >
                    {stage.title || "Новый этап"}
                  </button>
                  <span>{errors.join(" ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className={`${editorCard} grid gap-3.5`}>
        <Field label="Название воронки">
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(event) =>
              changeDraft({ title: event.currentTarget.value })
            }
            placeholder="Иллюстрация на заказ"
          />
        </Field>
        <div className="grid gap-3.5 lg:grid-cols-2">
          <Field label="Когда применять">
            <textarea
              className={`${fieldClass} min-h-16 leading-6`}
              value={draft.applicability}
              onChange={(event) =>
                changeDraft({ applicability: event.currentTarget.value })
              }
            />
          </Field>
          <Field label="Цель воронки">
            <textarea
              className={`${fieldClass} min-h-16 leading-6`}
              value={draft.goal}
              onChange={(event) =>
                changeDraft({ goal: event.currentTarget.value })
              }
            />
          </Field>
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className={`${editorCard} grid gap-3`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ListOrdered
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />{" "}
            Этапы
          </h3>
          <ol className="grid gap-1.5">
            {draft.stages.map((stage) => (
              <li key={stage.id}>
                <button
                  type="button"
                  aria-pressed={stage.id === selectedId}
                  onClick={() => setSelectedId(stage.id)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-ring aria-pressed:bg-accent aria-pressed:font-semibold"
                >
                  <span className="min-w-0 flex-1 break-words">
                    {stage.title || "Новый этап"}
                  </span>
                  {stage.archived && (
                    <span className="text-xs text-muted-foreground">Архив</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
          <button className={secondaryClass} type="button" onClick={addStage}>
            <Plus aria-hidden="true" className="size-4 shrink-0" /> Добавить
            этап
          </button>
        </aside>
        {selected ? (
          <div className="grid min-w-0 gap-4">
            <section className={`${editorCard} grid min-w-0 gap-4`}>
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="crm-stage-editor"
                  tabIndex={-1}
                  className="min-w-0 break-words text-lg font-semibold"
                >
                  {selected.title || "Новый этап"}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={iconButtonClass}
                    aria-label="Переместить этап выше"
                    disabled={selectedIndex === 0}
                    onClick={() => reorderStage(-1)}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButtonClass}
                    aria-label="Переместить этап ниже"
                    disabled={selectedIndex === draft.stages.length - 1}
                    onClick={() => reorderStage(1)}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={secondaryClass}
                    onClick={() =>
                      changeStage({ archived: !selected.archived })
                    }
                  >
                    {selected.archived ? (
                      <ArchiveRestore aria-hidden="true" className="size-4" />
                    ) : (
                      <Archive aria-hidden="true" className="size-4" />
                    )}
                    {selected.archived ? "Восстановить" : "Архивировать"}
                  </button>
                </div>
              </header>
              <StageFields
                stage={selected}
                people={people}
                payers={payers}
                onChange={changeStage}
              />
            </section>
            {!selected.archived && (
              <Preview
                stage={selected}
                nextStage={draft.stages
                  .slice(selectedIndex + 1)
                  .find((stage) => !stage.archived)}
              />
            )}
          </div>
        ) : (
          <p className={`${editorCard} text-sm text-muted-foreground`}>
            Добавьте этап, чтобы задать инструкции и действия исполнителя.
          </p>
        )}
      </div>
    </section>
  );
}

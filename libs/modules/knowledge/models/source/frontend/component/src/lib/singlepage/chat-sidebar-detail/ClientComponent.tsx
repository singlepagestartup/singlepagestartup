"use client";
import {
  readKnowledgeUserContext,
  readKnowledgeMaterials,
  replaceKnowledgeUserContext,
} from "@sps/shared-utils";

import { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Label,
  settingsFormStyles,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { Icon } from "@sps/ui-adapter";
import { useId, useState } from "react";
import Markdown from "markdown-to-jsx";

function formatKnowledgeDate(language: string, value?: string | Date | null) {
  const date = value ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) {
    return language === "ru" ? "Индекс ещё не создан" : "Not indexed";
  }

  return date.toLocaleString(language === "ru" ? "ru-RU" : [], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Component(props: IClientComponentProps) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  const ru = props.language === "ru";
  const isCreating = props.mode === "create";
  const isBusy = Boolean(props.isSaving || props.isDeleting);
  const retryIndex =
    !isCreating &&
    !props.isDirty &&
    props.needsReindex &&
    props.retryIndexOnSave;
  const canSave =
    !isBusy &&
    !props.saveBlocked &&
    (isCreating
      ? Boolean(props.draft.title.trim() && props.draft.content.trim())
      : props.isDirty || retryIndex);
  const saveLabel = isCreating
    ? ru
      ? "Создать источник знаний"
      : "Create knowledge"
    : ru
      ? "Сохранить источник знаний"
      : "Save knowledge";

  const materials = readKnowledgeMaterials(props.draft.content);
  return (
    <form
      data-module="knowledge"
      data-model="source"
      data-id={props.data?.id || ""}
      data-variant="chat-sidebar-detail"
      className={cn("min-w-0", props.className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) props.onSave(props.data);
      }}
    >
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor={`${id}-title`} className={settingsFormStyles.label}>
            {ru ? "Название" : "Title"}
          </Label>
          <Input
            id={`${id}-title`}
            aria-label={ru ? "Название источника" : "Knowledge title"}
            disabled={isBusy}
            value={props.draft.title}
            onChange={(event) => {
              props.onDraftChange({
                ...props.draft,
                title: event.target.value,
              });
            }}
            className={settingsFormStyles.field}
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label
              htmlFor={`${id}-context`}
              className={settingsFormStyles.label}
            >
              {ru ? "Контекст и заметки" : "Your context and notes"}
            </Label>
            <div className="flex rounded-lg bg-muted p-1">
              {([false, true] as const).map((showPreview) => (
                <Button
                  key={String(showPreview)}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={preview === showPreview}
                  className={cn(
                    "min-h-8 px-2 text-xs",
                    preview === showPreview && "bg-card",
                  )}
                  onClick={() => setPreview(showPreview)}
                >
                  {showPreview
                    ? ru
                      ? "Предпросмотр"
                      : "Preview"
                    : ru
                      ? "Редактор"
                      : "Editor"}
                </Button>
              ))}
            </div>
          </div>
          {preview ? (
            <div className="prose min-h-44 max-w-none break-words rounded-xl border border-border p-3 text-sm">
              <Markdown options={{ disableParsingRawHTML: true }}>
                {readKnowledgeUserContext(props.draft.content) ||
                  (ru
                    ? "Введите текст в редакторе."
                    : "Add text in the editor.")}
              </Markdown>
            </div>
          ) : (
            <Textarea
              id={`${id}-context`}
              aria-label={ru ? "Контекст и заметки" : "Knowledge content"}
              disabled={isBusy}
              value={readKnowledgeUserContext(props.draft.content)}
              onChange={(event) => {
                props.onDraftChange({
                  ...props.draft,
                  content: replaceKnowledgeUserContext(
                    props.draft.content,
                    event.target.value,
                  ),
                });
              }}
              rows={7}
              className={cn(settingsFormStyles.textarea, "font-mono")}
            />
          )}
        </div>
        {props.attachments}
        {materials ? (
          <details className="min-w-0 text-sm">
            <summary className="cursor-pointer font-semibold text-foreground">
              {ru ? "Разбор материалов" : "Analyzed materials"}
            </summary>
            <div className="prose mt-2 max-h-64 max-w-none overflow-auto break-words text-sm">
              <Markdown options={{ disableParsingRawHTML: true }}>
                {materials}
              </Markdown>
            </div>
          </details>
        ) : null}
        {!isCreating && (
          <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-muted-foreground">
                {ru ? "Статус" : "Status"}
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {props.data.contentHash &&
                props.data.contentHash === props.data.indexedContentHash
                  ? ru
                    ? "Проиндексировано"
                    : "Indexed"
                  : ru
                    ? "Нужна индексация"
                    : "Needs indexing"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">
                {ru ? "Последняя индексация" : "Last indexed"}
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {formatKnowledgeDate(props.language, props.data.lastIndexedAt)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">
                {ru ? "Идентификатор" : "Slug"}
              </dt>
              <dd className="mt-1 break-words text-foreground">
                {props.data.slug}
              </dd>
            </div>
          </dl>
        )}
      </div>
      <div className={settingsFormStyles.actions}>
        {!isCreating && props.onDelete && (
          <div className="mr-auto flex flex-wrap items-center gap-2">
            {props.onDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-auto gap-2 rounded-xl text-destructive hover:bg-destructive-surface hover:text-destructive"
                    aria-label={
                      ru ? "Удалить источник знаний" : "Delete knowledge"
                    }
                    disabled={isBusy}
                  >
                    <Icon name="trash" />
                    {props.isDeleting
                      ? ru
                        ? "Удаляем…"
                        : "Deleting"
                      : ru
                        ? "Удалить"
                        : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  overlayClassName="z-[75]"
                  className="z-[80] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] gap-5 overflow-y-auto rounded-2xl bg-card p-5 sm:rounded-2xl sm:p-6"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className={settingsFormStyles.title}>
                      {ru ? "Удалить источник знаний?" : "Delete Knowledge"}
                    </AlertDialogTitle>
                    <AlertDialogDescription
                      className={settingsFormStyles.description}
                    >
                      {ru
                        ? `Источник «${props.data.title}» и его индекс будут удалены из всех связанных профилей. Восстановить их нельзя.`
                        : `“${props.data.title}” and its search index will be deleted from every linked profile. This cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className={settingsFormStyles.secondary}
                      disabled={props.isDeleting}
                    >
                      {ru ? "Отмена" : "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={props.isDeleting}
                      className="min-h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        void props.onDelete?.(props.data);
                      }}
                    >
                      {props.isDeleting
                        ? ru
                          ? "Удаляем…"
                          : "Deleting"
                        : ru
                          ? "Удалить источник"
                          : "Delete Knowledge"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          className={settingsFormStyles.primary}
          aria-busy={props.isSaving}
          aria-label={saveLabel}
          disabled={!canSave}
        >
          <Icon name="floppy-disk" />
          {props.isSaving
            ? ru
              ? "Сохраняем…"
              : "Saving"
            : isCreating
              ? ru
                ? "Создать"
                : "Create"
              : ru
                ? "Сохранить"
                : "Save"}
        </Button>
      </div>
    </form>
  );
}

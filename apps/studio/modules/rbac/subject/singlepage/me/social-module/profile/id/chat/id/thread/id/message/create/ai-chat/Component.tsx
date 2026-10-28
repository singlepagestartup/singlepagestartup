"use client";
import { useSource } from "../../../../../../../../../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../../../../../../../shared/icon";

import { Component as FileStorageModuleFile } from "../../../../../../../../../../../../../../file-storage/file";
import { useThread } from "../../../../../../../../../../../../../../social/thread/singlepage/id/ai-chat/Thread";
import { useFiles } from "../../../../../../../../../../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import {
  readProjectFiles,
  isSupportedAiChatAttachment,
  AI_CHAT_ATTACHMENT_ACCEPT,
  AI_CHAT_ATTACHMENT_FORMAT_LABEL,
} from "../../../../../../../../../../../../../../file-storage/file/singlepage/list-attachments-ai-chat/utils";
import { useStudioAccount } from "../../../../../../../../../../account/Account";
import { useId, useRef, useEffect, useState, type FormEvent } from "react";

export function Component({
  variant = "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat",
  subjectId,
  profileId,
  chatId,
  threadId,
  sending = false,
  initialError = "",
}: IComponentProps = {}) {
  const { account } = useStudioAccount();
  const { source } = useSource();
  const {
    thread,
    workingOn,
    setWorkingOn,
    draft: value,
    setDraft: onChange,
    send: onSend,
    fileIds,
    attach,
    remove,
    move,
    reorder,
  } = useThread();
  const { files: records, register } = useFiles();
  const files = fileIds.flatMap(
    (id) => records.find((file) => file.id === id) ?? [],
  );
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(initialError);
  const busy = reading || sending;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(selected: FileList | null) {
    if (!selected?.length) return;
    const rejected = Array.from(selected).filter(
      (file) => !isSupportedAiChatAttachment(file),
    );
    const accepted = Array.from(selected).filter(
      (file) =>
        isSupportedAiChatAttachment(file) &&
        !files.some(
          (current) =>
            current.name === file.name &&
            current.size === file.size &&
            current.lastModified === file.lastModified,
        ),
    );
    setReading(true);
    setError(
      rejected.length
        ? `Неподдерживаемые файлы: ${rejected.map((file) => file.name).join(", ")}. Допустимые форматы: ${AI_CHAT_ATTACHMENT_FORMAT_LABEL}.`
        : "",
    );
    try {
      const uploaded = await readProjectFiles(accepted, id);
      if (mounted.current) {
        register(uploaded);
        attach(uploaded.map((file) => file.id));
      } else
        uploaded.forEach(
          (file) => file.fileUrl && URL.revokeObjectURL(file.fileUrl),
        );
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось прикрепить файлы. Попробуйте ещё раз.",
        );
    } finally {
      if (mounted.current) setReading(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy && (value.trim() || files.length)) {
      onSend();
      setError("");
    }
  }
  return (
    <form
      data-ds-block="rbac.subject.me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat"
      onSubmit={submit}
      className="max-h-[75%] min-w-0 shrink-0 overflow-y-auto border-t border-border bg-card p-4"
      data-module="rbac"
      data-model="subject"
      data-subject-id={subjectId ?? account.subject?.id}
      data-profile-id={profileId}
      data-chat-id={chatId}
      data-thread-id={threadId ?? thread.id}
      data-variant={variant}
    >
      <label htmlFor={id} className="sr-only">
        Сообщение
      </label>
      <label className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        Рабочий контекст
        <span className="relative min-w-0">
          <select
            aria-label="Рабочий контекст"
            value={workingOn}
            onChange={(event) =>
              setWorkingOn(event.target.value as "whole" | "source")
            }
            className="min-h-9 max-w-full appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-xs font-semibold text-foreground"
          >
            <option value="whole">Весь документ</option>
            <option value="source">{source.title}</option>
          </select>
          <SharedIcon
            variant="phosphor"
            name="caret-down"
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2"
          />
        </span>
      </label>
      <div className="rounded-2xl border border-border p-3 focus-within:border-foreground">
        {files.length > 0 && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              Файлов: {files.length} · Перетащите, чтобы изменить порядок
            </p>
            <ul
              aria-label="Вложения сообщения"
              className="mb-3 flex min-w-0 gap-2 overflow-x-auto pb-2"
            >
              {files.map((file, index) => (
                <FileStorageModuleFile
                  variant="list-item-pending-ai-chat"
                  key={file.id}
                  file={file}
                  onRemove={remove}
                  onMove={move}
                  onReorder={reorder}
                  first={index === 0}
                  last={index === files.length - 1}
                  disabled={busy}
                />
              ))}
            </ul>
          </>
        )}
        <textarea
          id={id}
          aria-label="Сообщение"
          value={value}
          required={!files.length}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey) &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (!event.repeat) event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Обсудите документ или попросите внести изменения."
          className="h-32 min-h-24 max-h-[min(50dvh,480px)] w-full min-w-0 resize-y bg-transparent text-sm leading-6 outline-none"
        />
        <input
          ref={picker}
          type="file"
          multiple
          accept={AI_CHAT_ATTACHMENT_ACCEPT}
          aria-label="Прикрепить файлы к сообщению"
          className="hidden"
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={busy}
            aria-busy={reading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <SharedIcon
              variant="phosphor"
              name="paperclip"
              className="size-4"
            />
            {reading ? "Добавляем файлы…" : "Прикрепить файлы"}
          </button>
          <button
            type="submit"
            title="Отправить (⌘ Enter / Ctrl Enter)"
            aria-keyshortcuts="Meta+Enter Control+Enter"
            disabled={busy || (!value.trim() && !files.length)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-95 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <SharedIcon
              variant="phosphor"
              name="paper-plane-tilt"
              className="size-4"
            />
            {sending ? "Отправляем…" : "Отправить"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ⌘ Enter / Ctrl Enter — отправить. Enter — новая строка.
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

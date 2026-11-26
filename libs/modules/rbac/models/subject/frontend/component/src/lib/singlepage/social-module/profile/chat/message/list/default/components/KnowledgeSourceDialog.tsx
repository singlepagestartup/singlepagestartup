"use client";

import { KnowledgeSource, KnowledgeSourceDraft } from "../types";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import { useRef, useState } from "react";
import Markdown from "markdown-to-jsx";
import { Icon } from "@sps/ui-adapter";
import {
  AI_CHAT_ATTACHMENT_ACCEPT,
  AI_CHAT_ATTACHMENT_FORMAT_LABEL,
  assertSupportedAiChatAttachments,
  readKnowledgeDocumentContent,
} from "@sps/shared-utils";
import {
  Button,
  settingsFormStyles,
  Dialog,
  SettingsDialogContent,
  SettingsDialogHeader,
} from "@sps/shared-ui-shadcn";

import { KnowledgeSourceFiles } from "./KnowledgeSourceFiles";
import { orderResultKnowledgeOrigin } from "@sps/rbac/models/subject/sdk/model";
import type { IProps as IFileScope } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";

interface KnowledgeSourceDialogProps {
  fileScope?: IFileScope;
  document: KnowledgeSource | null | undefined;
  draft: KnowledgeSourceDraft;
  isDirty: boolean;
  saveError?: string;
  saveBlocked?: boolean;
  isDeleting: boolean;
  isOpen: boolean;
  isSaving: boolean;
  language: string;
  readOnly?: boolean;
  personal?: boolean;
  mode: "create" | "edit";
  needsReindex: boolean;
  onDelete?: (document: KnowledgeSource) => Promise<void> | void;
  onDraftChange: (draft: KnowledgeSourceDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSave: (
    document: KnowledgeSource,
    files?: File[],
    removeFileIds?: string[],
    onSaved?: () => void,
  ) => void;
}

export function KnowledgeSourceDialog(props: KnowledgeSourceDialogProps) {
  const picker = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const ru = props.language === "ru";
  const isCreating = props.mode === "create";
  const closeLabel = ru ? "Закрыть" : "Close";
  const origin =
    props.personal && props.document
      ? orderResultKnowledgeOrigin(props.document.slug)
      : undefined;
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SettingsDialogContent closeLabel={closeLabel}>
        {props.readOnly ? (
          <>
            <SettingsDialogHeader
              title={
                props.document?.variant === "customer-memory" &&
                props.document.title === "Personal note"
                  ? ru
                    ? "Личная заметка"
                    : "Personal note"
                  : props.document?.title ||
                    (ru ? "Источник знаний" : "Knowledge source")
              }
              description={
                ru ? "Источник знаний профиля" : "Profile knowledge source"
              }
            />
            {origin && (
              <a
                href={`/${props.language}${origin.path}`}
                className="w-fit text-sm underline underline-offset-4"
              >
                {ru ? "Открыть результат заказа" : "Open order result"}
              </a>
            )}
            <div className="prose max-w-none break-words text-sm">
              <Markdown options={{ disableParsingRawHTML: true }}>
                {readKnowledgeDocumentContent(props.document?.content ?? "")}
              </Markdown>
            </div>
          </>
        ) : (
          <>
            <SettingsDialogHeader
              title={
                isCreating
                  ? ru
                    ? "Новый источник знаний"
                    : "Create Knowledge"
                  : ru
                    ? "Редактировать источник знаний"
                    : "Edit Knowledge"
              }
              description={
                origin
                  ? ru
                    ? "Оригинал заказа в знаниях вашего профиля."
                    : "An order original in your profile knowledge."
                  : props.personal
                    ? ru
                      ? "Сохраните сведения в своём профиле."
                      : "Save information in your personal profile."
                    : isCreating
                      ? ru
                        ? "Добавьте заметки и исходные материалы для сотрудника."
                        : "Add notes and reference files for the employee."
                      : ru
                        ? "Обновите текст или прикрепите файлы для ответов сотрудника."
                        : "Update the text or attach files for the assistant to use in its replies."
              }
            />
            {props.saveError && (
              <p role="alert" className="text-sm text-destructive">
                {props.saveError}
              </p>
            )}
            {props.document && (
              <KnowledgeModuleSource
                isServer={false}
                variant="chat-sidebar-detail"
                dataSource="props"
                data={props.document}
                language={props.language}
                draft={props.draft}
                isDeleting={props.isDeleting}
                isDirty={
                  props.isDirty || files.length > 0 || removed.length > 0
                }
                isSaving={props.isSaving}
                needsReindex={props.needsReindex}
                retryIndexOnSave
                saveBlocked={props.saveBlocked}
                mode={props.mode}
                onDelete={props.mode === "edit" ? props.onDelete : undefined}
                onDraftChange={props.onDraftChange}
                onSave={(document) =>
                  props.onSave(document, files, removed, () => {
                    setFiles([]);
                    setRemoved([]);
                    setFileError("");
                  })
                }
                attachments={
                  props.fileScope ? (
                    <section className="grid gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={settingsFormStyles.label}>
                          {ru
                            ? "Прикреплённые материалы"
                            : "Attached materials"}
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          className={`${settingsFormStyles.secondary} justify-self-start`}
                          disabled={props.isSaving}
                          onClick={() => picker.current?.click()}
                        >
                          <Icon name="paperclip" />
                          {ru ? "Добавить файлы" : "Add files"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {AI_CHAT_ATTACHMENT_FORMAT_LABEL}
                      </p>
                      <input
                        ref={picker}
                        type="file"
                        className="hidden"
                        multiple
                        accept={AI_CHAT_ATTACHMENT_ACCEPT}
                        aria-label={
                          ru ? "Файлы источника знаний" : "Knowledge files"
                        }
                        onChange={(event) => {
                          const selected = Array.from(
                            event.currentTarget.files ?? [],
                          );
                          event.currentTarget.value = "";
                          if (!selected.length) return;
                          try {
                            const next = [...files, ...selected];
                            assertSupportedAiChatAttachments(next);
                            setFiles(next);
                            setFileError("");
                          } catch (error) {
                            setFileError(
                              error instanceof Error
                                ? error.message
                                : String(error),
                            );
                          }
                        }}
                      />
                      {fileError && <p role="alert">{fileError}</p>}
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="break-all">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={props.isSaving}
                            aria-label={
                              ru ? `Убрать ${file.name}` : `Remove ${file.name}`
                            }
                            onClick={() =>
                              setFiles(files.filter((_, i) => i !== index))
                            }
                          >
                            <Icon name="x" />
                          </Button>
                        </div>
                      ))}
                      {!isCreating && (
                        <KnowledgeSourceFiles
                          scope={props.fileScope}
                          language={props.language}
                          removedIds={removed}
                          disabled={props.isSaving}
                          onRemove={(id) =>
                            setRemoved((current) => [...current, id])
                          }
                        />
                      )}
                    </section>
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </SettingsDialogContent>
    </Dialog>
  );
}

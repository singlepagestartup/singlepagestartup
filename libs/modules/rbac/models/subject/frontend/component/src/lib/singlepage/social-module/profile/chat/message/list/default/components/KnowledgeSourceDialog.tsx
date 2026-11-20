"use client";

import { KnowledgeSource, KnowledgeSourceDraft } from "../types";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import { readKnowledgeDocumentContent } from "@sps/shared-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sps/shared-ui-shadcn";

import { KnowledgeSourceFiles } from "./KnowledgeSourceFiles";
import type { IProps as IFileScope } from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";

interface KnowledgeSourceDialogProps {
  fileScope?: IFileScope;
  onFilesUpdated?: (source: KnowledgeSource) => void;
  document: KnowledgeSource | null | undefined;
  draft: KnowledgeSourceDraft;
  isDirty: boolean;
  isDeleting: boolean;
  isOpen: boolean;
  isReindexing: boolean;
  isSaving: boolean;
  language: string;
  readOnly?: boolean;
  mode: "create" | "edit";
  needsReindex: boolean;
  onUnlink?: (source: KnowledgeSource) => Promise<void> | void;
  onDelete: (document: KnowledgeSource) => Promise<void> | void;
  onDraftChange: (draft: KnowledgeSourceDraft) => void;
  onOpenChange: (open: boolean) => void;
  onReindex: (document: KnowledgeSource) => Promise<void> | void;
  onSave: (document: KnowledgeSource) => void;
}

export function KnowledgeSourceDialog(props: KnowledgeSourceDialogProps) {
  const ru = props.language === "ru";
  const isCreating = props.mode === "create";
  const closeLabel = ru ? "Закрыть" : "Close";
  if (props.readOnly) {
    return (
      <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
          closeLabel={closeLabel}
        >
          <DialogHeader>
            <DialogTitle>{props.document?.title}</DialogTitle>
            <DialogDescription>
              {ru ? "Источник знаний профиля" : "Profile knowledge source"}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap break-words text-sm">
            {readKnowledgeDocumentContent(props.document?.content ?? "")}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto p-0"
        closeLabel={closeLabel}
      >
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle>
            {isCreating
              ? ru
                ? "Новый источник знаний"
                : "Create Knowledge"
              : ru
                ? "Редактировать источник знаний"
                : "Edit Knowledge"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? ru
                ? "Добавьте сведения, которыми сотрудник будет пользоваться в работе."
                : "Create a knowledge source for this profile."
              : ru
                ? "Здесь можно изменить текст, прикрепить материалы и обновить поисковый индекс."
                : "Update and reindex this profile knowledge source."}
          </DialogDescription>
        </DialogHeader>
        {props.document ? (
          <KnowledgeModuleSource
            isServer={false}
            variant="chat-sidebar-detail"
            dataSource="props"
            data={props.document}
            language={props.language}
            draft={props.draft}
            isDeleting={props.isDeleting}
            isDirty={props.isDirty}
            isSaving={props.isSaving}
            isReindexing={props.isReindexing}
            needsReindex={props.needsReindex}
            mode={props.mode}
            onUnlink={props.onUnlink}
            onDelete={props.mode === "edit" ? props.onDelete : undefined}
            onDraftChange={props.onDraftChange}
            onSave={props.onSave}
            onReindex={props.onReindex}
          />
        ) : null}
        {props.mode === "edit" && props.fileScope && props.onFilesUpdated ? (
          <KnowledgeSourceFiles
            scope={props.fileScope}
            language={props.language}
            disabled={props.isDirty || props.isSaving}
            onUpdated={props.onFilesUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

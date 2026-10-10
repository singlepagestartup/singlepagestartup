"use client";

import { KnowledgeSource, KnowledgeSourceDraft } from "../types";
import { Component as KnowledgeModuleSourceChatSidebarDetail } from "@sps/knowledge/models/source/frontend/component/src/lib/singlepage/chat-sidebar-detail";
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
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle>
            {props.mode === "create" ? "Create Knowledge" : "Edit Knowledge"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Create a knowledge source for this profile."
              : "Update and reindex this profile knowledge source."}
          </DialogDescription>
        </DialogHeader>
        {props.document ? (
          <KnowledgeModuleSourceChatSidebarDetail
            isServer={false}
            variant="chat-sidebar-detail"
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
            className="max-h-[calc(90vh-96px)]"
          />
        ) : null}
        {props.mode === "edit" && props.fileScope && props.onFilesUpdated ? (
          <KnowledgeSourceFiles
            scope={props.fileScope}
            disabled={props.isDirty || props.isSaving}
            onUpdated={props.onFilesUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

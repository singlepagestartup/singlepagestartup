"use client";

import { KnowledgeDocument, KnowledgeDocumentDraft } from "../types";
import { Component as KnowledgeModuleDocumentChatSidebarDetail } from "@sps/knowledge/models/document/frontend/component/src/lib/singlepage/chat-sidebar-detail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sps/shared-ui-shadcn";

interface KnowledgeDocumentDialogProps {
  document: KnowledgeDocument | null | undefined;
  draft: KnowledgeDocumentDraft;
  isDirty: boolean;
  isOpen: boolean;
  isReindexing: boolean;
  isSaving: boolean;
  language: string;
  mode: "create" | "edit";
  needsReindex: boolean;
  onDraftChange: (draft: KnowledgeDocumentDraft) => void;
  onOpenChange: (open: boolean) => void;
  onReindex: (document: KnowledgeDocument) => Promise<void> | void;
  onSave: (document: KnowledgeDocument) => void;
}

export function KnowledgeDocumentDialog(props: KnowledgeDocumentDialogProps) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle>
            {props.mode === "create" ? "Create Knowledge" : "Edit Knowledge"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "create"
              ? "Create a knowledge document for this profile."
              : "Update and reindex this profile knowledge document."}
          </DialogDescription>
        </DialogHeader>
        {props.document ? (
          <KnowledgeModuleDocumentChatSidebarDetail
            isServer={false}
            variant="chat-sidebar-detail"
            data={props.document}
            language={props.language}
            draft={props.draft}
            isDirty={props.isDirty}
            isSaving={props.isSaving}
            isReindexing={props.isReindexing}
            needsReindex={props.needsReindex}
            mode={props.mode}
            onDraftChange={props.onDraftChange}
            onSave={props.onSave}
            onReindex={props.onReindex}
            className="max-h-[calc(90vh-96px)]"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

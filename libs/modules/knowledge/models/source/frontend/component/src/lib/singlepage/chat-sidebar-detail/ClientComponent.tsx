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
  ScrollArea,
  Textarea,
} from "@sps/shared-ui-shadcn";
import { RefreshCw, Save, Trash2 } from "lucide-react";

function formatKnowledgeDate(value?: string | Date | null) {
  if (!value) {
    return "Not indexed";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not indexed";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Component(props: IClientComponentProps) {
  const isCreating = props.mode === "create";
  const isBusy = Boolean(
    props.isSaving || props.isReindexing || props.isDeleting,
  );
  const canSave = isCreating
    ? Boolean(props.draft.title.trim() && props.draft.content.trim() && !isBusy)
    : Boolean(props.isDirty && !isBusy);

  return (
    <ScrollArea
      data-module="knowledge"
      data-model="source"
      data-id={props.data?.id || ""}
      data-variant="chat-sidebar-detail"
      className={cn("h-full", props.className)}
    >
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Title</label>
          <input
            aria-label="Knowledge title"
            value={props.draft.title}
            onChange={(event) => {
              props.onDraftChange({
                ...props.draft,
                title: event.target.value,
              });
            }}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">
            Your context and notes
          </label>
          <Textarea
            aria-label="Knowledge content"
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
            rows={12}
            className="min-h-56 resize-none text-sm"
          />
        </div>
        {readKnowledgeMaterials(props.draft.content) ? (
          <details className="rounded-md border p-3 text-sm">
            <summary>Analyzed materials</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs">
              {readKnowledgeMaterials(props.draft.content)}
            </pre>
          </details>
        ) : null}
        <dl className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="min-w-0">
            <dt className="text-slate-400">Status</dt>
            <dd className="mt-0.5 truncate text-slate-600">
              {props.data.contentHash === props.data.indexedContentHash
                ? "Indexed"
                : "Needs indexing"}
            </dd>
          </div>
          {!isCreating ? (
            <>
              <div className="min-w-0">
                <dt className="text-slate-400">Last indexed</dt>
                <dd className="mt-0.5 truncate text-slate-600">
                  {formatKnowledgeDate(props.data.lastIndexedAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-400">Slug</dt>
                <dd className="mt-0.5 truncate text-slate-600">
                  {props.data.slug}
                </dd>
              </div>
            </>
          ) : null}
        </dl>
        {props.needsReindex && !isCreating ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Saved changes are not indexed yet.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-auto"
            aria-label={isCreating ? "Create knowledge" : "Save knowledge"}
            onClick={() => {
              props.onSave(props.data);
            }}
            disabled={!canSave}
          >
            <Save className="mr-2 h-4 w-4" />
            {props.isSaving ? "Saving" : isCreating ? "Create" : "Save"}
          </Button>
          {!isCreating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-auto"
              aria-label="Reindex knowledge"
              onClick={() => {
                void props.onReindex(props.data);
              }}
              disabled={isBusy}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  props.isReindexing && "animate-spin",
                )}
              />
              {props.isReindexing ? "Reindexing" : "Reindex"}
            </Button>
          ) : null}
          {!isCreating && props.onUnlink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-auto"
              disabled={isBusy}
              onClick={() => {
                void props.onUnlink?.(props.data);
              }}
            >
              Unlink from profile
            </Button>
          ) : null}
          {!isCreating && props.onDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-auto"
                  aria-label="Delete knowledge"
                  disabled={isBusy}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {props.isDeleting ? "Deleting" : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Knowledge</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete this knowledge source and its indexed vectors? This
                    removes the source from every linked profile and cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={props.isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={props.isDeleting}
                    className="bg-red-600 text-white hover:bg-red-500"
                    onClick={() => {
                      void props.onDelete?.(props.data);
                    }}
                  >
                    {props.isDeleting ? "Deleting" : "Delete Knowledge"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
    </ScrollArea>
  );
}

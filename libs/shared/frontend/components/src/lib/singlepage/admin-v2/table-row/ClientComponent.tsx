"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Card } from "@sps/shared-ui-shadcn";
import { Monitor, Pencil, Trash2 } from "lucide-react";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.children) {
    return <>{props.children}</>;
  }

  const { entity } = props;
  if (
    !entity ||
    !props.tid ||
    !props.selectedModel ||
    !props.selectedModule ||
    !props.copyFeedback ||
    !props.copyToClipboard ||
    !props.openPreviewDialog ||
    !props.openEntityEditorById ||
    !props.openConfirmDialog
  ) {
    return null;
  }

  const tid = props.tid;
  const selectedModel = props.selectedModel;
  const selectedModule = props.selectedModule;
  const copyFeedback = props.copyFeedback;
  const copyToClipboard = props.copyToClipboard;
  const openPreviewDialog = props.openPreviewDialog;
  const openEntityEditorById = props.openEntityEditorById;
  const openConfirmDialog = props.openConfirmDialog;

  return (
    <Card
      data-testid={tid("entity-card", selectedModel, entity.id)}
      className="rounded-lg border border-slate-300 bg-surface p-5 transition hover:border-slate-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="truncate text-lg font-semibold">
              {entity.adminTitle || entity.title || "Untitled"}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {entity.slug ? (
              <div>
                <span className="text-slate-500">Slug</span>
                <p className="mt-0.5 break-all font-mono text-slate-900">
                  {entity.slug}
                </p>
              </div>
            ) : null}

            {entity.shortDescription ? (
              <div className="col-span-2">
                <span className="text-slate-500">Short Description</span>
                <p className="mt-0.5 line-clamp-2 text-slate-900">
                  {entity.shortDescription}
                </p>
              </div>
            ) : null}

            {entity.variant ? (
              <div>
                <span className="text-slate-500">Variant</span>
                <p className="mt-0.5 text-slate-900">{entity.variant}</p>
              </div>
            ) : null}

            <div>
              <span className="text-slate-500">ID</span>
              <div className="mt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  data-testid={tid("entity-copy-id", selectedModel, entity.id)}
                  className={cn(
                    "block !w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-0.5 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
                    copyFeedback[entity.id] &&
                      "border-emerald-500 bg-emerald-100 text-emerald-700",
                  )}
                  title={entity.id}
                  aria-label="Copy id"
                  onClick={() => copyToClipboard(entity.id)}
                >
                  {entity.id}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid={tid("entity-preview", selectedModel, entity.id)}
            className="!w-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100"
            onClick={() => openPreviewDialog(selectedModel, entity.id)}
          >
            <Monitor className="mr-2 h-4 w-4" />
            Preview
          </Button>

          <Button
            type="button"
            variant="outline"
            data-testid={tid("entity-edit", selectedModel, entity.id)}
            className="!w-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100"
            onClick={() => {
              openEntityEditorById(entity.id, {
                append: false,
                modelName: selectedModel,
                moduleId: selectedModule,
              });
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button
            type="button"
            variant="outline"
            data-testid={tid("entity-delete", selectedModel, entity.id)}
            className="!w-auto rounded-md border border-slate-300 bg-white p-2 text-sm transition hover:bg-slate-100"
            aria-label="Delete"
            onClick={() => {
              openConfirmDialog({
                actionType: "entity-delete",
                title: "Delete entity?",
                description:
                  "This action cannot be undone. The entity will be permanently removed.",
                confirmLabel: "Delete entity",
                payload: {
                  modelName: selectedModel,
                  id: entity.id,
                },
              });
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@sps/shared-ui-shadcn";
import { Check, Copy, Monitor, Pencil, Trash2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { IComponentProps, IComponentPropsExtended } from "./interface";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {
    onDelete?: (e: any) => void;
    children?: ReactNode;
  },
) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(props.data?.id || "");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const payload = props.data as {
    id?: string;
    adminTitle?: string;
    title?: Record<string, string> | string;
    shortDescription?: Record<string, string> | string;
    slug?: string;
    variant?: string;
  };

  return (
    <div
      data-module={props.module}
      data-variant={props.variant}
      className={cn("w-full", props.className)}
      {...(props.type === "relation"
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
    >
      <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm transition hover:border-slate-400">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "h-auto w-fit max-w-full gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-left font-mono text-xs text-slate-900 hover:bg-slate-100",
              copied &&
                "border-emerald-500 bg-emerald-100 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 hover:text-emerald-700",
            )}
            title={props.data?.id}
          >
            <span className="max-w-44 overflow-hidden text-ellipsis whitespace-nowrap">
              {props.data?.id}
            </span>
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            {props.type !== "relation" ? (
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Monitor className="h-3 w-3" />
                  <span className="hidden lg:inline">Preview</span>
                </Button>
                <DialogContent className="max-h-[80vh] overflow-y-auto p-0 lg:max-w-4xl">
                  <DialogTitle className="px-6 pt-6">
                    Frontend Preview
                  </DialogTitle>
                  <DialogDescription className="px-6 pb-4">
                    Placeholder mode. Component preview stays model-scoped.
                  </DialogDescription>
                  <div className="border-t p-6">
                    <div className="rounded-lg border border-dashed border-border bg-card p-5">
                      <p className="text-sm text-muted-foreground">
                        Module: {props.module}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Model: {props.name}
                      </p>
                      <p className="mt-2 font-mono text-sm">ID: {payload.id}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}

            {props.adminForm ? (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                  <span className="hidden lg:inline">Edit</span>
                </Button>
                <DialogContent className="max-h-[80vh] overflow-y-scroll p-0 lg:max-w-screen-lg">
                  <DialogTitle className="sr-only">Edit</DialogTitle>
                  <DialogDescription className="sr-only">
                    Edit entity form
                  </DialogDescription>
                  {props.adminForm({
                    data: props.data,
                    isServer: props.isServer,
                  })}
                </DialogContent>
              </Dialog>
            ) : null}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden lg:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      props.onDelete?.(e);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {props.children ? (
          <div className="mt-4">{props.children}</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {"adminTitle" in payload && payload.adminTitle ? (
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <p className="text-xs text-slate-500">Admin Title</p>
                <p className="truncate text-slate-900">
                  {String(payload.adminTitle)}
                </p>
              </div>
            ) : null}
            {"slug" in payload && payload.slug ? (
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <p className="text-xs text-slate-500">Slug</p>
                <p className="truncate text-slate-900">
                  {String(payload.slug)}
                </p>
              </div>
            ) : null}
            {"variant" in payload && payload.variant ? (
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <p className="text-xs text-slate-500">Variant</p>
                <p className="truncate text-slate-900">
                  {String(payload.variant)}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </article>
    </div>
  );
}

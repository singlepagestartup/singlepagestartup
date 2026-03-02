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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@sps/shared-ui-shadcn";
import { Monitor, Pencil, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { IComponentProps, IComponentPropsExtended } from "./interface";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {
    onDelete?: (e: any) => void;
    children?: ReactNode;
  },
) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRelatedOpen, setIsRelatedOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isRelation = props.type === "relation";

  const payload = props.data as {
    id?: string;
    adminTitle?: string;
    slug?: string;
    variant?: string;
  };

  return (
    <div
      data-module={props.module}
      data-variant={props.variant}
      className={cn("w-full", props.className)}
      {...(isRelation
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
    >
      <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm transition hover:border-slate-400">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {props.children ? (
              props.children
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
          </div>

          <div
            className={cn(
              "shrink-0",
              isRelation ? "flex flex-col gap-2" : "flex items-center gap-2",
            )}
          >
            {!isRelation ? (
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
              <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("gap-2", isRelation ? "px-2" : undefined)}
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                  {!isRelation ? (
                    <span className="hidden lg:inline">Edit</span>
                  ) : null}
                </Button>
                <SheetContent
                  side="right"
                  className="h-screen w-full max-w-3xl overflow-y-auto p-0 sm:max-w-3xl"
                >
                  <SheetTitle className="sr-only">Edit</SheetTitle>
                  <SheetDescription className="sr-only">
                    Edit entity form
                  </SheetDescription>
                  {props.adminForm({
                    data: props.data,
                    isServer: props.isServer,
                  })}
                </SheetContent>
              </Sheet>
            ) : null}

            {isRelation && props.relatedAdminForm ? (
              <Sheet open={isRelatedOpen} onOpenChange={setIsRelatedOpen}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2"
                  onClick={() => setIsRelatedOpen(true)}
                >
                  <SquareArrowOutUpRight className="h-3 w-3" />
                </Button>
                <SheetContent
                  side="right"
                  className="h-screen w-full max-w-3xl overflow-y-auto p-0 sm:max-w-3xl"
                >
                  <SheetTitle className="sr-only">Open related</SheetTitle>
                  <SheetDescription className="sr-only">
                    Open related entity form
                  </SheetDescription>
                  {props.relatedAdminForm({
                    data: props.data,
                    isServer: props.isServer,
                  })}
                </SheetContent>
              </Sheet>
            ) : null}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("gap-2", isRelation ? "px-2" : undefined)}
                >
                  <Trash2 className="h-3 w-3" />
                  {!isRelation ? (
                    <span className="hidden lg:inline">Delete</span>
                  ) : null}
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
      </article>
    </div>
  );
}

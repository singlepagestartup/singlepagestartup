"use client";

import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@sps/shared-ui-shadcn";
import { Check, Copy, Pencil, Trash } from "lucide-react";
import { cn, copyToClipboard } from "@sps/shared-frontend-client-utils";
import { DialogDescription } from "@radix-ui/react-dialog";
import { IComponentPropsExtended, IComponentProps } from "./interface";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {
    onDelete?: (e: any) => void;
    children: ReactNode;
  },
) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void copyToClipboard(props.data?.id || "");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
      <div className="relative rounded-lg border border-input bg-background">
        <div className="flex items-center px-5 absolute transform -translate-y-1/2 inset-x-0 w-full justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              {
                "bg-green-200 border-green-500 text-green-700 hover:bg-green-200 hover:border-green-500 hover:text-green-700":
                  copied,
              },
              "gap-2 w-fit",
            )}
          >
            <p className="max-w-40 overflow-hidden whitespace-nowrap text-ellipsis text-sm">
              {props.data?.id}
            </p>
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <div className="flex items-center gap-3">
            {props.adminForm ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-3 w-3" />
                    <p className="hidden lg:inline">Edit</p>
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 lg:w-full lg:max-w-screen-lg max-h-[80vh] overflow-y-scroll">
                  <DialogTitle className="hidden">Edit</DialogTitle>
                  <DialogDescription className="hidden">Edit</DialogDescription>
                  {props.data
                    ? props.adminForm({
                        data: props.data,

                        isServer: props.isServer,
                      })
                    : null}
                </DialogContent>
              </Dialog>
            ) : null}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Trash className="h-3 w-3" />
                  <p className="hidden lg:inline">Delete</p>
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
                      if (!props.onDelete) {
                        return;
                      }

                      props.onDelete(e);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {props.children}
      </div>
    </div>
  );
}

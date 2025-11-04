"use client";

import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  Button,
  DialogDescription,
} from "@sps/shared-ui-shadcn";
import { ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended, IComponentProps } from "./interface";
import { type IComponentProps as ITableControllerComponentProps } from "../table-controller/Component";

export function Component<M extends { id: string }, V>(
  props: Omit<
    IComponentPropsExtended<M, V, IComponentProps<M, V>>,
    "adminForm"
  > & {
    adminForm?: ReactNode;
    children: ReactNode;
    title?: string;
    module: string;
    name: string;
    type?: "model" | "relation";
  } & ITableControllerComponentProps,
) {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(true);

  return (
    <div
      data-module={props.module}
      data-variant={props.variant}
      className={cn(
        "relative gap-6 rounded-lg border border-input w-full bg-input",
        props.className,
      )}
      {...(props.type === "relation"
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
    >
      <div className="flex absolute top-0 inset-x-0 px-4 transform -translate-y-1/2 justify-between items-center">
        <Button variant="outline" size="sm" className="gap-2 w-fit">
          {props.title || props.name}
        </Button>
        <div className="flex items-center gap-3">
          {props.adminForm ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-3 w-3" /> Add new
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 lg:w-full lg:max-w-screen-lg max-h-[80vh] overflow-y-scroll">
                <DialogTitle className="hidden">{props.title}</DialogTitle>
                <DialogDescription className="hidden">
                  {props.title}
                </DialogDescription>
                {props.adminForm}
              </DialogContent>
            </Dialog>
          ) : null}
          <Button
            onClick={() => {
              setShow(!show);
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ChevronsUpDown className="h-3 w-3" /> {show ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
      <div className={show ? "" : "hidden"}>{props.children}</div>
    </div>
  );
}

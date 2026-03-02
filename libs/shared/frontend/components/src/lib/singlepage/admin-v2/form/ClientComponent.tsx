"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { Save } from "lucide-react";
import { IComponentProps } from "./interface";

function formatLabel(value?: string) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Component(props: IComponentProps) {
  const title = props.id
    ? `Update ${formatLabel(props.name)}`
    : `Create ${formatLabel(props.name)}`;

  return (
    <div
      data-module={props.module}
      data-id={props.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-slate-50",
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
      <header className="border-b border-border bg-white px-6 pb-4 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {props.id ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {props.id}
          </p>
        ) : null}
      </header>

      {props.form ? (
        <Form {...props.form}>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {props.children ?? null}
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-border bg-white p-6">
              <Button
                type="button"
                variant="primary"
                onClick={
                  props.onSubmit
                    ? props.form.handleSubmit(props.onSubmit)
                    : undefined
                }
                disabled={props.status === "pending"}
                className={
                  props.status === "success"
                    ? "bg-green-500 hover:bg-green-500/90"
                    : props.status === "error"
                      ? "bg-red-500 hover:bg-red-500/90"
                      : ""
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {props.status === "pending"
                  ? "Saving..."
                  : props.id
                    ? "Save Changes"
                    : "Create"}
              </Button>
            </footer>
          </div>
        </Form>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {props.children ?? null}
        </div>
      )}
    </div>
  );
}

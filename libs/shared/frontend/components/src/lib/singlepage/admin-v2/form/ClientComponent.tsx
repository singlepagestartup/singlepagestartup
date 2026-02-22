"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <div
      data-module={props.module}
      data-id={props.id || ""}
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
      <aside
        data-panel-depth={props.panelDepth}
        className={cn(
          "absolute right-0 top-0 flex h-screen w-full max-w-3xl origin-right flex-col overflow-hidden border-l border-border bg-slate-50 shadow-[0_12px_42px_rgba(15,23,42,0.24)] transition-transform duration-300",
          props.isTop ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={props.style}
      >
        {props.children ?? null}
      </aside>
    </div>
  );
}

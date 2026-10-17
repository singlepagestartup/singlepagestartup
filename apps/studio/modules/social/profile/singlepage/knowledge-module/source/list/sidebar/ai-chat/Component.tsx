"use client";
import type {
  IComponentProps,
  IProfileSourceSidebarListProps,
} from "./interface";
export type { IProfileSourceSidebarListProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { useId, useState } from "react";

import { Component as KnowledgeModuleSource } from "../../../../../../../../knowledge/source";

export function Component({
  variant = "knowledge-module-source-list-sidebar-ai-chat",
  href,
  selected = false,
}: IComponentProps) {
  const id = useId();
  const [open, setOpen] = useState(true);
  const kit = {
    focus:
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  };
  return (
    <div
      className="rounded-xl bg-black/20 p-1.5"
      data-module="social"
      data-model="profile"
      data-variant={variant}
    >
      <button
        type="button"
        aria-label={open ? "Hide document list" : "Show document list"}
        aria-expanded={open}
        aria-controls={`${id}-document-list`}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-card/10 px-3 py-2 text-left text-sm font-semibold ${kit.focus}`}
      >
        <SharedIcon variant="phosphor" name="folder-open" className="size-4" />
        <span className="flex-1">Documents</span>
        <span className="text-xs text-default-foreground/60">1</span>
        <SharedIcon
          variant="phosphor"
          name="caret-down"
          className={`size-4 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={`${id}-document-list`} hidden={!open} className="ml-3 mt-1">
        <KnowledgeModuleSource
          variant="list-item-document-ai-chat"
          selected={selected}
          href={href}
        />
      </div>
    </div>
  );
}

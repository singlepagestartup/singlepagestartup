"use client";
import { useId, useState } from "react";
import { Component as Thread } from "@sps/social/models/thread/frontend/component";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const id = useId();
  const [open, setOpen] = useState(true);
  return (
    <div
      className={`rounded-xl bg-black/20 p-1.5 ${props.className || ""}`}
      data-module="social"
      data-model="profile"
      data-variant={props.variant}
      data-id={props.data.id}
    >
      <button
        type="button"
        aria-label={open ? "Hide document list" : "Show document list"}
        aria-expanded={open}
        aria-controls={`${id}-document-list`}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg bg-card/10 px-3 py-2 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="folder-open" className="size-4" />
        <span className="flex-1">Documents</span>
        <span className="text-xs text-default-foreground/60">
          {props.documents.length}
        </span>
        <Icon
          name="caret-down"
          className={`size-4 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={`${id}-document-list`} hidden={!open} className="ml-3 mt-1">
        {props.documents.map((document) => (
          <Thread
            key={document.data.id}
            isServer={false}
            variant="list-item-sidebar-ai-chat"
            language={props.language}
            {...document}
            selected={!!document.selected}
          />
        ))}
      </div>
    </div>
  );
}

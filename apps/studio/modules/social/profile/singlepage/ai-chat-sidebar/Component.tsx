"use client";
import { Component as KnowledgeModuleSource } from "../../../../knowledge/source/index";
import { useId, useState } from "react";
import { useProfiles } from "../ai-chat-project/Profiles";
import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

export interface IProfileSidebarProps {
  profileId: string;
  selected: "products" | "settings" | "thread-create";
  mobile?: boolean;
}
export function Component({
  profileId,
  selected,
  mobile,
}: IProfileSidebarProps) {
  const id = useId();
  const { projects } = useProfiles();
  const name =
    projects.find((profile) => profile.id === profileId)?.name ?? "Project";
  const href = `/ai-chat/projects/${encodeURIComponent(profileId)}`;
  const settingsSelected = selected === "settings";
  const creatingThread = selected === "thread-create";
  const [open, setOpen] = useState(true);
  return (
    <>
      <h1
        className={`mb-3 break-words text-lg font-semibold ${mobile ? "pr-10" : ""}`}
      >
        {name}
      </h1>
      <nav aria-label="Project navigation" className="space-y-1">
        <a
          href={`${href}/settings`}
          aria-label="Project settings"
          aria-current={settingsSelected ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 ${kit.focus} ${settingsSelected ? "bg-white/15" : "text-white/80"}`}
        >
          <Icon name="gear-six" className="size-4" />
          Settings
        </a>
        <div className="rounded-xl bg-black/20 p-1.5">
          <button
            type="button"
            aria-label={open ? "Hide document list" : "Show document list"}
            aria-expanded={open}
            aria-controls={`${id}-document-list`}
            onClick={() => setOpen((current) => !current)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-semibold ${kit.focus}`}
          >
            <Icon name="folder-open" className="size-4" />
            <span className="flex-1">Documents</span>
            <span className="text-xs text-white/60">1</span>
            <Icon
              name="caret-down"
              className={`size-4 ${open ? "rotate-180" : ""}`}
            />
          </button>
          <div id={`${id}-document-list`} hidden={!open} className="ml-3 mt-1">
            <KnowledgeModuleSource
              variant="ai-chat-document-link"
              selected={!settingsSelected && !creatingThread}
              href={href}
            />
          </div>
        </div>
      </nav>
      <section
        aria-label="Project threads"
        className="mt-5 border-t border-white/10 pt-4"
      >
        <h2 className="mb-3 text-xs font-semibold text-white/60">Threads</h2>
        <a
          href={`${href}/threads/new`}
          aria-current={creatingThread ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 ${creatingThread ? "bg-white/15" : ""} ${kit.focus}`}
        >
          <Icon name="plus" className="size-4" />
          New thread
        </a>
      </section>
    </>
  );
}

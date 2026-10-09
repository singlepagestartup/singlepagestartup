"use client";
import { useId, useState } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { Component as SourceNavigation } from "../../../../../knowledge/models/source/singlepage/ai-chat-navigation/index";
export interface IProfileNavigationProps {
  name: string;
  mobile?: boolean;
  settingsSelected: boolean;
  onSettings: () => void;
  onDocument: () => void;
}
export function Component({
  name,
  mobile,
  settingsSelected,
  onSettings,
  onDocument,
}: IProfileNavigationProps) {
  const id = useId();
  const [open, setOpen] = useState(true);
  return (
    <>
      <h1
        className={`mb-3 break-words text-lg font-semibold ${mobile ? "pr-10" : ""}`}
      >
        {name}
      </h1>
      <nav aria-label="Project navigation" className="space-y-1">
        <button
          type="button"
          onClick={onSettings}
          aria-label="Project settings"
          aria-pressed={settingsSelected}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 ${kit.focus} ${settingsSelected ? "bg-white/15" : "text-white/80"}`}
        >
          <Icon name="gear-six" className="size-4" />
          Settings
        </button>
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
            <SourceNavigation
              selected={!settingsSelected}
              onSelect={onDocument}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

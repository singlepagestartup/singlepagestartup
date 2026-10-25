"use client";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { Component as KnowledgeModuleSource } from "../../../../../../knowledge/source/index";
import { useId, useState } from "react";
import { useProfiles } from "../../../scope/ai-chat/project/Profiles";
import {
  aiChatProfileHref,
  aiChatThreadCreateHref,
} from "../../../../../../host/layout/singlepage/ai-chat-landing/routes";
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IProfileSidebarProps {
  profileId: string;
  chatId?: string;
  selected: "products" | "settings" | "thread-create";
}
export function Component({
  profileId,
  chatId,
  selected,
}: IProfileSidebarProps) {
  const id = useId();
  const { projects } = useProfiles();
  const name =
    projects.find((profile) => profile.id === profileId)?.name ?? "Project";
  const href = aiChatProfileHref(profileId);
  const settingsSelected = selected === "settings";
  const creatingThread = selected === "thread-create";
  const [open, setOpen] = useState(true);
  return (
    <>
      <h1 className="mb-3 break-words pr-10 text-lg font-semibold @[760px]/workspace:pr-0">
        {name}
      </h1>
      <nav aria-label="Навигация по проекту" className="space-y-1">
        <a
          href={`${href}/settings`}
          aria-label="Настройки проекта"
          aria-current={settingsSelected ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 ${kit.focus} ${settingsSelected ? "bg-white/15" : "text-white/80"}`}
        >
          <Icon name="gear-six" className="size-4" />
          Настройки
        </a>
        <div className="rounded-xl bg-black/20 p-1.5">
          <button
            type="button"
            aria-label={
              open ? "Скрыть список документов" : "Показать список документов"
            }
            aria-expanded={open}
            aria-controls={`${id}-document-list`}
            onClick={() => setOpen((current) => !current)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-sm font-semibold ${kit.focus}`}
          >
            <Icon name="folder-open" className="size-4" />
            <span className="flex-1">Документы</span>
            <span className="text-xs text-white/60">1</span>
            <Icon
              name="caret-down"
              className={`size-4 ${open ? "rotate-180" : ""}`}
            />
          </button>
          <div id={`${id}-document-list`} hidden={!open} className="ml-3 mt-1">
            <KnowledgeModuleSource
              variant="list-item-document-ai-chat"
              selected={!settingsSelected && !creatingThread}
              href={href}
            />
          </div>
        </div>
      </nav>
      <section
        aria-label="Обсуждения проекта"
        className="mt-5 border-t border-white/10 pt-4"
      >
        <h2 className="mb-3 text-xs font-semibold text-white/60">Обсуждения</h2>
        <a
          href={aiChatThreadCreateHref(profileId, chatId)}
          aria-current={creatingThread ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 ${creatingThread ? "bg-white/15" : ""} ${kit.focus}`}
        >
          <Icon name="plus" className="size-4" />
          Новое обсуждение
        </a>
      </section>
    </>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};

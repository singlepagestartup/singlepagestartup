"use client";
import {
  type ReactNode as ReactNodePresentation,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Component as WebsiteBuilderModuleButton } from "../../../../../website-builder/button/index";

import IconGlyphs from "../../../../../website-builder/feature/singlepage/icon/icons.json";
import { Component as KnowledgeModuleSource } from "../../../../../knowledge/source/index";

import { useSource } from "../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";
import { Component as ThreadMessageList } from "../../message/list/ai-chat/index";
import { ThreadProvider, useThread } from "./Thread";
interface IPanelHeaderProps {
  title: string;
  label: string;
  navigation?: ReactNodePresentation;
  actions?: ReactNodePresentation;
}
function PanelHeader({ title, label, navigation, actions }: IPanelHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[color:var(--workspace-brand-line)] bg-white p-4 @[760px]/workspace:top-0">
      <div className="flex min-w-0 items-center gap-3">
        {navigation}
        <div className="min-w-0">
          <p className={`text-xs ${kit.muted}`}>{label}</p>
          <h2 className="mt-1 break-words text-base font-semibold">{title}</h2>
        </div>
      </div>
      {actions}
    </header>
  );
}
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
export interface IThreadOverviewProps {
  navigation?: ReactNode;
  messageCreate?: ReactNode;
}
export function Component(props: IThreadOverviewProps) {
  return (
    <ThreadProvider>
      <ThreadOverview {...props} />
    </ThreadProvider>
  );
}
function ThreadOverview({ navigation, messageCreate }: IThreadOverviewProps) {
  const {
    thread,
    pane,
    setPane,
    workingOn,
    discuss,
    proposal,
    apply,
    dismiss,
    error,
  } = useThread();
  const { source } = useSource();
  const proposalView = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pane === "chat" && proposal)
      proposalView.current?.scrollIntoView({ block: "nearest" });
  }, [pane, proposal]);
  return (
    <div
      data-ds-block="social.thread.overview-ai-chat"
      data-module="social"
      data-model="thread"
      data-id={thread.id}
      data-thread-id={thread.id}
      data-variant="overview-ai-chat"
      data-knowledge-source-ids={source.id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      aria-label={thread.title}
    >
      <PanelHeader
        title={thread.title}
        label="Обсуждение документа"
        navigation={navigation}
        actions={
          <div className="flex rounded-lg bg-[color:var(--workspace-brand-background)] p-1 @[800px]/chat:hidden">
            {(["chat", "document"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pane === item}
                onClick={() => setPane(item)}
                className={`min-h-9 rounded-md px-3 text-xs font-semibold ${kit.focus} ${pane === item ? "bg-[color:var(--workspace-brand-surface)]" : kit.muted}`}
              >
                {item === "chat" ? "Чат" : "Документ"}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid min-h-0 min-w-0 flex-1 @[800px]/chat:grid-cols-[minmax(0,1fr)_360px]">
        <div
          className={`${pane === "chat" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-y-auto @[800px]/chat:flex`}
        >
          <div data-ai-chat-messages className="min-h-0 flex-1 overflow-y-auto">
            <ThreadMessageList className="min-h-48" />
            {proposal && (
              <div
                ref={proposalView}
                className="mx-4 mb-4 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-background)] p-4"
              >
                <p className="text-xs font-semibold">
                  Предложенное изменение · {source.title}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {proposal.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={apply}>
                    <Icon name="pencil-simple" className="size-4" />
                    Применить к документу
                  </Button>
                  <Button variant="plain" onClick={dismiss}>
                    Отклонить
                  </Button>
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-sm">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
          {messageCreate}
        </div>
        <div
          className={`${pane === "document" ? "block" : "hidden"} min-h-0 min-w-0 overflow-y-auto border-[color:var(--workspace-brand-line)] @[800px]/chat:block @[800px]/chat:border-l`}
        >
          <KnowledgeModuleSource
            variant="overview-document-ai-chat"
            discussing={workingOn === "source"}
            onDiscuss={discuss}
          />
        </div>
      </div>
    </div>
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
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});

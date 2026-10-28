"use client";

import { usePreviewLayout } from "../../../../../../host/layout/singlepage/ai-chat-landing/Navigation";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { Component as ProfileScope } from "../../../scope/ai-chat/project/index";
import {
  Component as ProfileSidebar,
  type IProfileSidebarProps,
} from "../../../sidebar/ai-chat/project/index";

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
export interface IOverviewAiChatProjectProps {
  profileId: string;
  chatId?: string;
  selected: IProfileSidebarProps["selected"];
  children: (navigation: ReactNode) => ReactNode;
}
export function Component({
  profileId,
  chatId,
  selected,
  children,
}: IOverviewAiChatProjectProps) {
  return (
    <ProfileScope profileId={profileId}>
      <OverviewAiChatProject
        profileId={profileId}
        chatId={chatId}
        selected={selected}
      >
        {children}
      </OverviewAiChatProject>
    </ProfileScope>
  );
}
function OverviewAiChatProject({
  profileId,
  chatId,
  selected,
  children,
}: IOverviewAiChatProjectProps) {
  const embedded = usePreviewLayout();
  const Container = embedded ? "div" : "main";
  const id = useId();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTrigger = useRef<HTMLButtonElement>(null);
  const drawerClose = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (drawerOpen) drawerClose.current?.focus();
  }, [drawerOpen]);
  function closeDrawer() {
    setDrawerOpen(false);
    drawerTrigger.current?.focus();
  }
  const toggle = (
    <>
      <Button
        ref={drawerTrigger}
        variant="plain"
        className="min-h-9 shrink-0 px-2 @[760px]/workspace:hidden"
        aria-label="Показать меню проекта"
        aria-expanded={drawerOpen}
        aria-controls={`${id}-sidebar`}
        onClick={() => setDrawerOpen((current) => !current)}
      >
        <Icon name="list" />
      </Button>
      <Button
        variant="plain"
        className="hidden min-h-9 shrink-0 px-2 @[760px]/workspace:inline-flex"
        aria-label={
          sidebarOpen ? "Скрыть меню проекта" : "Показать меню проекта"
        }
        aria-expanded={sidebarOpen}
        aria-controls={`${id}-sidebar`}
        onClick={() => setSidebarOpen((current) => !current)}
      >
        <Icon name="list" />
      </Button>
    </>
  );
  return (
    <Container
      className={`@container/workspace mx-auto max-w-[1440px] ${embedded ? "" : "px-4 py-6 @[640px]:px-5"}`}
    >
      <div
        id="documents"
        data-ds-block="social.profile.overview-ai-chat-project"
        data-module="social"
        data-model="profile"
        data-id={profileId}
        data-variant="overview-ai-chat-project"
        data-sidebar-open={sidebarOpen}
        data-drawer-open={drawerOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape" && drawerOpen) {
            event.preventDefault();
            closeDrawer();
          }
        }}
        className="group/project relative grid min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] h-[calc(100dvh-9rem)] min-h-[560px] @[760px]/workspace:data-[sidebar-open=true]:grid-cols-[210px_minmax(0,1fr)]"
      >
        <button
          type="button"
          aria-label="Закрыть меню проекта"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={closeDrawer}
          className="absolute inset-0 z-20 hidden bg-black/40 @max-[760px]/workspace:group-data-[drawer-open=true]/project:block"
        />
        <aside
          id={`${id}-sidebar`}
          aria-label="Обсуждения проекта"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setDrawerOpen(false);
            }
          }}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) {
              setDrawerOpen(false);
            }
          }}
          className="absolute inset-y-0 left-0 z-30 hidden w-80 max-w-[calc(100%-3rem)] min-w-0 overflow-y-auto bg-[color:var(--workspace-brand-foreground)] p-4 text-white shadow-xl @max-[760px]/workspace:group-data-[drawer-open=true]/project:block @[760px]/workspace:static @[760px]/workspace:z-auto @[760px]/workspace:w-auto @[760px]/workspace:max-w-none @[760px]/workspace:shadow-none @[760px]/workspace:group-data-[sidebar-open=true]/project:block @[760px]/workspace:group-data-[sidebar-open=false]/project:hidden"
        >
          <button
            ref={drawerClose}
            type="button"
            aria-label="Закрыть меню"
            onClick={closeDrawer}
            className={`absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/10 @[760px]/workspace:hidden ${kit.focus}`}
          >
            <Icon name="x" />
          </button>
          <ProfileSidebar
            profileId={profileId}
            chatId={chatId}
            selected={selected}
          />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">{children(toggle)}</div>
      </div>
    </Container>
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

"use client";
import IconGlyphs from "../../../../feature/singlepage/icon/icons.json";
import { Component as WebsiteBuilderModuleLogotype } from "../../../../logotype/index";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../buttons-array/index";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
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
export interface INavbarNavigationProps {
  onNavigate: () => void;
  onCloseAutoFocus: (event: Event) => void;
}
export interface INavbarAiChatProps {
  buttonsArrayId: string;
  activeHref?: string;
  navigationLayout?: "inline" | "collapsible";
  navigationLabel?: string;
  profileSelect?: (props: INavbarNavigationProps) => ReactNode;
  subjectAccount?: (props: INavbarNavigationProps) => ReactNode;
}
export function Component({
  buttonsArrayId,
  activeHref,
  navigationLayout = "collapsible",
  navigationLabel = "Navigation",
  profileSelect,
  subjectAccount,
}: INavbarAiChatProps) {
  const widgetId = "navbar-ai-chat";
  const navigationId = useId();
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);
  const closeAutoFocus = useCallback(
    (event: Event) => {
      if (!navigationOpen && navigationTrigger.current?.offsetParent) {
        event.preventDefault();
        navigationTrigger.current.focus();
      }
    },
    [navigationOpen],
  );
  const collapsible = navigationLayout === "collapsible";
  const navigationProps = {
    onNavigate: closeNavigation,
    onCloseAutoFocus: closeAutoFocus,
  };
  return (
    <header
      data-ds-block="website-builder.widget.navbar-ai-chat"
      data-module="website-builder"
      data-model="widget"
      data-id={widgetId}
      data-variant="navbar-ai-chat"
      className={`sticky top-0 z-40 border-b border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-3 @[800px]:px-8 @[800px]:py-5 ${collapsible ? "h-18 @[800px]:h-24" : ""}`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-2 @[800px]:gap-5 ${collapsible ? "h-full" : "flex-wrap"}`}
      >
        <WebsiteBuilderModuleLogotype variant="brand-ai-chat" />
        <nav
          aria-label={navigationLabel}
          className="flex shrink-0 items-center justify-end gap-1"
          onKeyDown={(event) => {
            if (event.key === "Escape" && navigationOpen) {
              closeNavigation();
              navigationTrigger.current?.focus();
            }
          }}
        >
          <div
            id={navigationId}
            className={
              collapsible
                ? `${navigationOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-start gap-1 border-b border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-3 shadow-lg @[800px]:static @[800px]:flex @[800px]:flex-row @[800px]:items-center @[800px]:border-0 @[800px]:p-0 @[800px]:shadow-none`
                : "flex items-center gap-1"
            }
          >
            <WebsiteBuilderModuleButtonsArray
              variant="navbar-ai-chat"
              id={buttonsArrayId}
              activeHref={activeHref}
              onNavigate={closeNavigation}
            />
            {profileSelect?.(navigationProps)}
          </div>
          {subjectAccount?.(navigationProps)}
          {collapsible && (
            <button
              type="button"
              ref={navigationTrigger}
              aria-label={
                navigationOpen
                  ? "Закрыть меню навигации"
                  : "Открыть меню навигации"
              }
              aria-expanded={navigationOpen}
              aria-controls={navigationId}
              onClick={() => setNavigationOpen((open) => !open)}
              className={`inline-flex size-11 items-center justify-center rounded-xl text-[color:var(--workspace-brand-muted)] hover:bg-[color:var(--workspace-brand-background)] @[800px]:hidden ${kit.focus}`}
            >
              <Icon name={navigationOpen ? "x" : "list"} />
            </button>
          )}
        </nav>
      </div>
    </header>
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

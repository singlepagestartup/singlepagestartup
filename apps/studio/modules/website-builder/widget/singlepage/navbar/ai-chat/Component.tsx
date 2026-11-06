"use client";
import type {
  IComponentProps,
  INavbarNavigationProps,
  INavbarAiChatProps,
} from "./interface";
export type { INavbarNavigationProps, INavbarAiChatProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as Logotype } from "../../../../logotype/index";
import { Component as ButtonsArray } from "../../../../buttons-array/index";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "navbar-ai-chat",
  buttonsArrayId,
  activeHref,
  navigationLayout = "collapsible",
  navigationLabel = "Navigation",
  profileSelect,
  subjectAccount,
}: IComponentProps) {
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
      data-id={widgetId}
      className={`sticky top-0 z-40 border-b border-border bg-card px-4 py-3 @[800px]:px-8 @[800px]:py-5 ${collapsible ? "h-18 @[800px]:h-24" : ""}`}
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-2 @[800px]:gap-5 ${collapsible ? "h-full" : "flex-wrap"}`}
      >
        <Logotype variant="brand-ai-chat" />
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
                ? `${navigationOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-start gap-1 border-b border-border bg-card px-4 py-3 shadow-lg @[800px]:static @[800px]:flex @[800px]:flex-row @[800px]:items-center @[800px]:border-0 @[800px]:p-0 @[800px]:shadow-none`
                : "flex items-center gap-1"
            }
          >
            <ButtonsArray
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
              className={`inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted @[800px]:hidden ${kit.focus}`}
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};

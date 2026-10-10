"use client";
import { Component as WebsiteBuilderModuleLogotype } from "../../../../logotype/index";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../buttons-array/index";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

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
      className={`sticky top-0 z-40 border-b border-sps-line bg-sps-white px-4 py-3 @[800px]:px-8 @[800px]:py-5 ${collapsible ? "h-18 @[800px]:h-24" : ""}`}
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
                ? `${navigationOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-start gap-1 border-b border-sps-line bg-sps-white px-4 py-3 shadow-lg @[800px]:static @[800px]:flex @[800px]:flex-row @[800px]:items-center @[800px]:border-0 @[800px]:p-0 @[800px]:shadow-none`
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
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={navigationOpen}
              aria-controls={navigationId}
              onClick={() => setNavigationOpen((open) => !open)}
              className={`inline-flex size-11 items-center justify-center rounded-xl text-sps-muted hover:bg-sps-grey @[800px]:hidden ${kit.focus}`}
            >
              <Icon name={navigationOpen ? "x" : "list"} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

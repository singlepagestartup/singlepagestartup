"use client";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import { Component as Logotype } from "../../../logotype/singlepage/ai-chat/index";
import { Component as ButtonsArray } from "../../../buttons-array/singlepage/ai-chat-header/index";
import { Component as WidgetLogotypes } from "../../../../relations/widgets-to-logotypes/singlepage/ai-chat-find/index";
import { Component as WidgetButtonsArrays } from "../../../../relations/widgets-to-buttons-arrays/singlepage/ai-chat-find/index";

export interface IHeaderNavigationProps {
  onNavigate: () => void;
  onCloseAutoFocus: (event: Event) => void;
}
export interface IAIChatHeaderProps {
  page: "register" | "login" | "settings" | "help" | "tokens" | "chat";
  profileSelect?: (props: IHeaderNavigationProps) => ReactNode;
  subjectAccount?: (props: IHeaderNavigationProps) => ReactNode;
}
export function Component({
  page,
  profileSelect,
  subjectAccount,
}: IAIChatHeaderProps) {
  const widgetId = "ai-chat-header";
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
  const auth = page === "register" || page === "login";
  const buttonsArrayId =
    page === "register"
      ? "ai-chat-login"
      : page === "login"
        ? "ai-chat-register"
        : "ai-chat-help";
  const navigationProps = {
    onNavigate: closeNavigation,
    onCloseAutoFocus: closeAutoFocus,
  };
  return (
    <header
      data-ds-block="website-builder.widget.ai-chat-header"
      data-module="website-builder"
      data-model="widget"
      data-id={widgetId}
      data-variant="ai-chat-header"
      className={`sticky top-0 z-40 border-b border-sps-line bg-sps-white px-4 py-3 @[800px]:px-8 @[800px]:py-5 ${auth ? "" : "h-18 @[800px]:h-24"}`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-2 @[800px]:gap-5 ${auth ? "flex-wrap" : "h-full"}`}
      >
        <WidgetLogotypes
          variant="find"
          data={[
            {
              id: `${widgetId}:logotype`,
              widgetId,
              logotypeId: "ai-chat-logotype",
              orderIndex: 0,
            },
          ]}
          apiProps={{
            params: {
              filters: {
                and: [{ column: "widgetId", method: "eq", value: widgetId }],
              },
            },
          }}
        >
          {(relations) =>
            relations.map((relation) =>
              relation.logotypeId === "ai-chat-logotype" ? (
                <Logotype key={relation.id} />
              ) : null,
            )
          }
        </WidgetLogotypes>
        <nav
          aria-label={auth ? "Account access" : "Account navigation"}
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
              auth
                ? "flex items-center gap-1"
                : `${navigationOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col items-start gap-1 border-b border-sps-line bg-sps-white px-4 py-3 shadow-lg @[800px]:static @[800px]:flex @[800px]:flex-row @[800px]:items-center @[800px]:border-0 @[800px]:p-0 @[800px]:shadow-none`
            }
          >
            <WidgetButtonsArrays
              variant="find"
              data={[
                {
                  id: `${widgetId}:${buttonsArrayId}`,
                  widgetId,
                  buttonsArrayId,
                  orderIndex: 0,
                },
              ]}
              apiProps={{
                params: {
                  filters: {
                    and: [
                      { column: "widgetId", method: "eq", value: widgetId },
                    ],
                  },
                },
              }}
            >
              {(relations) =>
                relations.map((relation) => (
                  <ButtonsArray
                    key={relation.id}
                    id={relation.buttonsArrayId}
                    activeHref={`/ai-chat/${page}`}
                    onNavigate={closeNavigation}
                  />
                ))
              }
            </WidgetButtonsArrays>
            {!auth && profileSelect?.(navigationProps)}
          </div>
          {!auth && subjectAccount?.(navigationProps)}
          {!auth && (
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

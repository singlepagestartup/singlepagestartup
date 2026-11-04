"use client";
import type { IComponentProps, IIdAiChatProjectProps } from "./interface";
export type { IIdAiChatProjectProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

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
import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as ProfileScope } from "../../../scope/ai-chat/project/index";
import {
  Component as ProfileSidebar,
  type IProfileSidebarProps,
} from "../../../sidebar/ai-chat/project/index";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "id-ai-chat-project",
  profileId,
  chatId,
  selected,
  embedded = false,
  children,
}: IComponentProps) {
  return (
    <div
      data-module="social"
      data-model="profile"
      data-variant={variant}
      data-id={profileId}
    >
      <ProfileScope profileId={profileId}>
        <IdAiChatProject
          profileId={profileId}
          chatId={chatId}
          selected={selected}
          embedded={embedded}
        >
          {children}
        </IdAiChatProject>
      </ProfileScope>
    </div>
  );
}
function IdAiChatProject({
  profileId,
  chatId,
  selected,
  embedded = false,
  children,
}: IIdAiChatProjectProps) {
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
      className={`@container/workspace w-full ${embedded ? "" : "px-4 py-6 @[800px]:px-8"}`}
    >
      <div
        id="documents"
        data-ds-block="social.profile.id-ai-chat-project"
        data-id={profileId}
        data-sidebar-open={sidebarOpen}
        data-drawer-open={drawerOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape" && drawerOpen) {
            event.preventDefault();
            closeDrawer();
          }
        }}
        className="group/project relative mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card h-[calc(100dvh-9rem)] min-h-[560px] @[760px]/workspace:data-[sidebar-open=true]:grid-cols-[210px_minmax(0,1fr)]"
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
          className="absolute inset-y-0 left-0 z-30 hidden w-80 max-w-[calc(100%-3rem)] min-w-0 overflow-y-auto bg-default p-4 text-default-foreground shadow-xl @max-[760px]/workspace:group-data-[drawer-open=true]/project:block @[760px]/workspace:static @[760px]/workspace:z-auto @[760px]/workspace:w-auto @[760px]/workspace:max-w-none @[760px]/workspace:shadow-none @[760px]/workspace:group-data-[sidebar-open=true]/project:block @[760px]/workspace:group-data-[sidebar-open=false]/project:hidden"
        >
          <button
            ref={drawerClose}
            type="button"
            aria-label="Закрыть меню"
            onClick={closeDrawer}
            className={`absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg hover:bg-card/10 @[760px]/workspace:hidden ${kit.focus}`}
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
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

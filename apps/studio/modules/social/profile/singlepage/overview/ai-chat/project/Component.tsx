"use client";
import { Component as ProfileScope } from "../../../scope/ai-chat/project/index";
import {
  Component as ProfileSidebar,
  type IProfileSidebarProps,
} from "../../../sidebar/ai-chat/project/index";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

export interface IOverviewAiChatProjectProps {
  profileId: string;
  selected: IProfileSidebarProps["selected"];
  children: (navigation: ReactNode) => ReactNode;
}

export function Component({
  profileId,
  selected,
  children,
}: IOverviewAiChatProjectProps) {
  return (
    <ProfileScope profileId={profileId}>
      <OverviewAiChatProject profileId={profileId} selected={selected}>
        {children}
      </OverviewAiChatProject>
    </ProfileScope>
  );
}

function OverviewAiChatProject({
  profileId,
  selected,
  children,
}: IOverviewAiChatProjectProps) {
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
        aria-label="Show sidebar"
        aria-expanded={drawerOpen}
        aria-controls={`${id}-sidebar`}
        onClick={() => setDrawerOpen((current) => !current)}
      >
        <Icon name="list" />
      </Button>
      <Button
        variant="plain"
        className="hidden min-h-9 shrink-0 px-2 @[760px]/workspace:inline-flex"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        aria-expanded={sidebarOpen}
        aria-controls={`${id}-sidebar`}
        onClick={() => setSidebarOpen((current) => !current)}
      >
        <Icon name="list" />
      </Button>
    </>
  );

  return (
    <main className="@container/workspace mx-auto max-w-[1440px] px-4 py-6 @[640px]:px-5">
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
        className="group/project relative grid min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-sps-line bg-sps-white @[760px]/workspace:h-160 @[760px]/workspace:data-[sidebar-open=true]:grid-cols-[210px_minmax(0,1fr)]"
      >
        <button
          type="button"
          aria-label="Close project sidebar"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={closeDrawer}
          className="absolute inset-0 z-20 hidden bg-black/40 @max-[760px]/workspace:group-data-[drawer-open=true]/project:block"
        />
        <aside
          id={`${id}-sidebar`}
          aria-label="Project conversations"
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
          className="absolute inset-y-0 left-0 z-30 hidden w-80 max-w-[calc(100%-3rem)] min-w-0 overflow-y-auto bg-sps-graphite p-4 text-white shadow-xl @max-[760px]/workspace:group-data-[drawer-open=true]/project:block @[760px]/workspace:static @[760px]/workspace:z-auto @[760px]/workspace:w-auto @[760px]/workspace:max-w-none @[760px]/workspace:shadow-none @[760px]/workspace:group-data-[sidebar-open=true]/project:block @[760px]/workspace:group-data-[sidebar-open=false]/project:hidden"
        >
          <button
            ref={drawerClose}
            type="button"
            aria-label="Close sidebar"
            onClick={closeDrawer}
            className={`absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg hover:bg-white/10 @[760px]/workspace:hidden ${kit.focus}`}
          >
            <Icon name="x" />
          </button>
          <ProfileSidebar profileId={profileId} selected={selected} />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">{children(toggle)}</div>
      </div>
    </main>
  );
}

"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, ScrollArea } from "@sps/shared-ui-shadcn";
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <aside
      id="sidebar"
      data-variant="admin"
      data-component="admin-sidebar"
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300",
        isSidebarOpen ? "w-80" : "w-14",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          isSidebarOpen ? "justify-between px-4" : "justify-center px-2",
        )}
      >
        <div
          className={cn("flex items-center gap-2", !isSidebarOpen && "hidden")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">A</span>
          </div>
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>

        {!isSidebarOpen ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">A</span>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="!w-8 rounded-md p-1.5 transition hover:bg-muted"
          aria-label="Toggle sidebar"
          onClick={() => setIsSidebarOpen((current) => !current)}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className={cn("flex-1 overflow-hidden", !isSidebarOpen && "hidden")}>
        <ScrollArea className="h-full px-3 py-4">
          <section className="space-y-2">{props.children}</section>
        </ScrollArea>
      </div>

      {props.showSettingsButton !== false && isSidebarOpen ? (
        <div className="border-t border-border p-3">
          {props.settingsHref ? (
            <Button
              asChild
              id="settingsButton"
              type="button"
              variant="outline"
              data-action="open-settings"
              className={cn(
                "!w-full justify-start rounded-md px-3 py-2 text-sm transition",
                props.isSettingsView
                  ? "border border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900"
                  : "hover:bg-muted",
              )}
            >
              <Link href={props.settingsHref}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </Button>
          ) : (
            <Button
              id="settingsButton"
              type="button"
              variant="outline"
              data-action="open-settings"
              className={cn(
                "!w-full justify-start rounded-md px-3 py-2 text-sm transition",
                props.isSettingsView
                  ? "border border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900"
                  : "hover:bg-muted",
              )}
              onClick={props.onOpenSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Button>
          )}
        </div>
      ) : null}
    </aside>
  );
}

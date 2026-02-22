"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, ScrollArea } from "@sps/shared-ui-shadcn";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <aside
      id="sidebar"
      data-variant="admin"
      data-component="admin-sidebar"
      data-module={props.state.selectedModule}
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
          <section className="space-y-2">
            {props.modules.map((moduleItem) => {
              const isModuleSelected =
                moduleItem.id === props.state.selectedModule;
              const isModuleExpanded =
                moduleItem.id === props.state.expandedModule;
              const moduleModels = props.modelsByModule[moduleItem.id] || [];
              const search = props.state.modelSearch.trim().toLowerCase();

              const visibleModels = isModuleExpanded
                ? moduleModels.filter((modelName) =>
                    modelName.toLowerCase().includes(search),
                  )
                : [];

              return (
                <div
                  key={moduleItem.id}
                  className={cn(
                    "rounded-md",
                    isModuleExpanded &&
                      `bg-slate-50 border ${isModuleSelected ? "border-black" : "border-slate-200"} p-1.5`,
                  )}
                >
                  <Button
                    type="button"
                    variant="outline"
                    data-module-item={moduleItem.id}
                    className={cn(
                      "!w-full justify-between rounded-md border px-3 py-2 text-left text-sm",
                      isModuleSelected
                        ? "border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900"
                        : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
                    )}
                    onClick={() => props.onSelectModule(moduleItem.id)}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="text-base">{moduleItem.icon}</span>
                      <span className="truncate">{moduleItem.name}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[10px] leading-none",
                          isModuleSelected
                            ? "border-white/40 bg-white/15 text-white"
                            : "border-slate-300 bg-white text-slate-500",
                        )}
                      >
                        {moduleModels.length}
                      </span>

                      {isModuleExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </Button>

                  {isModuleExpanded ? (
                    <div className="mt-2 space-y-1 pl-3">
                      {visibleModels.length ? (
                        visibleModels.map((modelName) => {
                          const isSelected =
                            !props.isModuleView &&
                            modelName === props.state.selectedModel;

                          return (
                            <Button
                              key={modelName}
                              type="button"
                              variant="outline"
                              data-model-item={`${moduleItem.id}:${modelName}`}
                              className={cn(
                                "!w-full justify-start rounded-md border px-3 py-2 text-left text-sm",
                                isSelected
                                  ? "border-slate-900 bg-slate-900 text-white shadow-sm font-semibold hover:bg-slate-900"
                                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white",
                              )}
                              onClick={() =>
                                props.onSelectModel(moduleItem.id, modelName)
                              }
                            >
                              <span
                                className={cn(
                                  "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                                  isSelected ? "bg-white" : "bg-slate-300",
                                )}
                              />
                              <span className="ml-2 truncate">{modelName}</span>
                            </Button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-500">
                          No models found for current filter.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        </ScrollArea>
      </div>

      {props.showSettingsButton !== false && isSidebarOpen ? (
        <div className="border-t border-border p-3">
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
        </div>
      ) : null}
    </aside>
  );
}

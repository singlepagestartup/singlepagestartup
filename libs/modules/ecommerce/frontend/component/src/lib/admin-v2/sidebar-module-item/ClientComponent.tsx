"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { IComponentProps } from "./interface";

function getAdminRoutePath(pathname: string | null): string {
  const value = pathname || "";
  const adminIndex = value.indexOf("/admin");

  if (adminIndex === -1) {
    return "/";
  }

  const next = value.slice(adminIndex + "/admin".length) || "/";
  return next.replace(/\/+$/, "") || "/";
}

export function Component(props: IComponentProps) {
  const pathname = usePathname();
  const currentPath = useMemo(() => getAdminRoutePath(pathname), [pathname]);
  const routeMatch = currentPath.match(
    /^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/,
  );
  const selectedModuleFromRoute = routeMatch?.[1] || "";
  const selectedModelFromRoute = routeMatch?.[2] || "";
  const isModuleView = Boolean(routeMatch?.[1] && !routeMatch?.[2]);
  const adminBasePath = useMemo(() => {
    const path = pathname || "";
    const adminIndex = path.indexOf("/admin");

    if (adminIndex === -1) {
      return "/admin";
    }

    return path.slice(0, adminIndex + "/admin".length);
  }, [pathname]);
  const isModuleSelected = props.moduleItem.id === selectedModuleFromRoute;
  const modulePathPrefix = `/modules/${props.moduleItem.id}`;
  const isModuleExpanded =
    currentPath === modulePathPrefix ||
    currentPath.startsWith(`${modulePathPrefix}/`);
  const moduleModels = props.models || [];

  return (
    <div
      className={cn(
        "rounded-md",
        isModuleExpanded &&
          `bg-slate-50 border ${isModuleSelected ? "border-black" : "border-slate-200"} p-1.5`,
      )}
    >
      <Button
        asChild
        type="button"
        variant="outline"
        data-module-item={props.moduleItem.id}
        className={cn(
          "!w-full justify-between rounded-md border px-3 py-2 text-left text-sm",
          isModuleSelected
            ? "border-black bg-slate-900 text-white shadow-sm hover:bg-slate-900"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
        )}
      >
        <Link href={`${adminBasePath}/modules/${props.moduleItem.id}`}>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="text-base">{props.moduleItem.icon}</span>
            <span className="truncate">{props.moduleItem.name}</span>
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
        </Link>
      </Button>

      {isModuleExpanded ? (
        <div className="mt-2 space-y-1 pl-3">
          {moduleModels.length ? (
            moduleModels.map((modelName) => {
              const isSelected =
                !isModuleView &&
                selectedModuleFromRoute === props.moduleItem.id &&
                modelName === selectedModelFromRoute;

              return (
                <Button
                  key={modelName}
                  asChild
                  type="button"
                  variant="outline"
                  data-model-item={`${props.moduleItem.id}:${modelName}`}
                  className={cn(
                    "!w-full justify-start rounded-md border px-3 py-2 text-left text-sm",
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm font-semibold hover:bg-slate-900"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white",
                  )}
                >
                  <Link
                    href={`${adminBasePath}/modules/${props.moduleItem.id}/models/${modelName}`}
                  >
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                        isSelected ? "bg-white" : "bg-slate-300",
                      )}
                    />
                    <span className="ml-2 truncate">{modelName}</span>
                  </Link>
                </Button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-slate-500">
              No models found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

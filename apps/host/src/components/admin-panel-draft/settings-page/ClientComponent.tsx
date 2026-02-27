"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Card } from "@sps/shared-ui-shadcn";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { CircleHelp, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { settingsOperationConfigs, TSettingsOperationKey } from "./data";
import { useCallback, useMemo, useState } from "react";

export type TSettingsOperationState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

type ISettingsPageProps = {
  adminBasePath: string;
};

const initialSettingsOperationState: Record<
  TSettingsOperationKey,
  TSettingsOperationState
> = {
  backendCacheClear: {
    status: "idle",
    message: "",
  },
  frontendRevalidate: {
    status: "idle",
    message: "",
  },
};

function getSettingsOperationStatus(status: TSettingsOperationState["status"]) {
  if (status === "success") {
    return {
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
      text: "Success",
    };
  }

  if (status === "error") {
    return {
      badgeClass: "border-red-300 bg-red-50 text-red-700",
      text: "Error",
    };
  }

  if (status === "loading") {
    return {
      badgeClass: "border-amber-300 bg-amber-50 text-amber-700",
      text: "Running",
    };
  }

  return {
    badgeClass: "border-slate-300 bg-slate-50 text-slate-600",
    text: "Idle",
  };
}

function getAdminRoutePath(pathname: string | null): string {
  const value = pathname || "";
  const adminIndex = value.indexOf("/admin");

  if (adminIndex === -1) {
    return "/";
  }

  const next = value.slice(adminIndex + "/admin".length) || "/";
  return next.replace(/\/+$/, "") || "/";
}

function isSettingsRoute(path: string): boolean {
  return path === "/settings" || path.startsWith("/settings/");
}

export function Component(props: ISettingsPageProps) {
  const pathname = usePathname();
  const currentPath = useMemo(() => getAdminRoutePath(pathname), [pathname]);

  const [operations, setOperations] = useState(initialSettingsOperationState);

  const runSettingsOperation = useCallback(
    async (key: TSettingsOperationKey) => {
      const config = settingsOperationConfigs[key];

      setOperations((previous) => ({
        ...previous,
        [key]: {
          status: "loading",
          message: "Running operation...",
        },
      }));

      try {
        const response = await fetch(config.endpoint, {
          method: config.method,
        });

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        setOperations((previous) => ({
          ...previous,
          [key]: {
            status: "success",
            message: config.successMessage,
          },
        }));
      } catch (error) {
        setOperations((previous) => ({
          ...previous,
          [key]: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Operation failed. Check backend route availability.",
          },
        }));
      }
    },
    [],
  );

  const backendState = operations.backendCacheClear;
  const frontendState = operations.frontendRevalidate;
  const backendStatus = getSettingsOperationStatus(backendState.status);
  const frontendStatus = getSettingsOperationStatus(frontendState.status);

  if (!isSettingsRoute(currentPath)) {
    return null;
  }

  const content = (
    <section data-testid="settings-page" className="space-y-4">
      <Card className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Maintenance</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">Clear Backend Cache</h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
                  backendStatus.badgeClass,
                )}
              >
                {backendStatus.text}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Clears backend HTTP cache via
              <code className="ml-1 rounded bg-white px-1 py-0.5 font-mono text-xs">
                /api/http-cache/clear
              </code>
              .
            </p>

            <p className="mt-2 min-h-5 text-xs text-slate-500">
              {backendState.message || ""}
            </p>

            <Button
              type="button"
              disabled={backendState.status === "loading"}
              className="mt-3 !w-auto rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
              onClick={() => runSettingsOperation("backendCacheClear")}
            >
              {backendState.status === "loading" ? "Running..." : "Run action"}
            </Button>
          </Card>

          <Card className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">
                Revalidate Frontend Layout
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
                  frontendStatus.badgeClass,
                )}
              >
                {frontendStatus.text}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Triggers frontend revalidation via
              <code className="ml-1 rounded bg-white px-1 py-0.5 font-mono text-xs">
                /api/revalidate?path=/&amp;type=layout
              </code>
              .
            </p>

            <p className="mt-2 min-h-5 text-xs text-slate-500">
              {frontendState.message || ""}
            </p>

            <Button
              type="button"
              disabled={frontendState.status === "loading"}
              className="mt-3 !w-auto rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
              onClick={() => runSettingsOperation("frontendRevalidate")}
            >
              {frontendState.status === "loading" ? "Running..." : "Run action"}
            </Button>
          </Card>
        </div>
      </Card>
    </section>
  );

  return (
    <EcommerceAdminV2Component
      adminBasePath={props.adminBasePath}
      isSettingsView
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b border-border bg-card px-6">
          <div className="flex min-w-0 flex-1 items-center gap-4" />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="!w-10 rounded-md p-2 transition hover:bg-muted"
              aria-label="Help"
            >
              <CircleHelp className="h-5 w-5" />
            </Button>

            <Button
              asChild
              variant="outline"
              size="icon"
              className="!w-10 rounded-md p-2 transition hover:bg-muted"
            >
              <Link
                href={`${props.adminBasePath}/profile`}
                aria-label="Account"
              >
                <UserRound className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight capitalize">
                Settings
              </h1>
            </div>

            {content}
          </div>
        </main>
      </div>
    </EcommerceAdminV2Component>
  );
}

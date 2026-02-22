"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Card } from "@sps/shared-ui-shadcn";
import { settingsOperationConfigs, TSettingsOperationKey } from "./data";

export type TSettingsOperationState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

type ISettingsPageProps = {
  operations: Record<TSettingsOperationKey, TSettingsOperationState>;
  onRequestOperation?: (key: TSettingsOperationKey) => void;
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

export function Component(props: ISettingsPageProps) {
  const backendState = props.operations.backendCacheClear;
  const frontendState = props.operations.frontendRevalidate;
  const backendStatus = getSettingsOperationStatus(backendState.status);
  const frontendStatus = getSettingsOperationStatus(frontendState.status);

  return (
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
              onClick={() => props.onRequestOperation?.("backendCacheClear")}
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
              onClick={() => props.onRequestOperation?.("frontendRevalidate")}
            >
              {frontendState.status === "loading" ? "Running..." : "Run action"}
            </Button>
          </Card>
        </div>
      </Card>
    </section>
  );
}

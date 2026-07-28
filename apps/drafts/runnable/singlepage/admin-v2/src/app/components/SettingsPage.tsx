import React, { useState } from "react";
import { settingsOperationConfigs } from "../data";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

type OperationStatus = "idle" | "loading" | "success" | "error";

interface OperationState {
  status: OperationStatus;
  message: string;
}

function getStatusBadge(status: OperationStatus) {
  if (status === "success") {
    return {
      className: "border-emerald-300 bg-emerald-50 text-emerald-700",
      text: "Success",
    };
  }
  if (status === "error") {
    return {
      className: "border-red-300 bg-red-50 text-red-700",
      text: "Error",
    };
  }
  if (status === "loading") {
    return {
      className: "border-amber-300 bg-amber-50 text-amber-700",
      text: "Running",
    };
  }
  return {
    className: "border-slate-300 bg-slate-50 text-slate-600",
    text: "Idle",
  };
}

export function SettingsPage() {
  const [operations, setOperations] = useState<Record<string, OperationState>>({
    backendCacheClear: { status: "idle", message: "" },
    frontendRevalidate: { status: "idle", message: "" },
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    operationKey: string;
  }>({ open: false, operationKey: "" });

  const openConfirm = (operationKey: string) => {
    setConfirmDialog({ open: true, operationKey });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, operationKey: "" });
  };

  const runOperation = async (operationKey: string) => {
    const config = settingsOperationConfigs[operationKey];
    if (!config) return;

    closeConfirm();

    setOperations((prev) => ({
      ...prev,
      [operationKey]: { status: "loading", message: "Request in progress..." },
    }));

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock: always succeed for prototype
    setOperations((prev) => ({
      ...prev,
      [operationKey]: { status: "success", message: config.successMessage },
    }));
  };

  const confirmConfig = confirmDialog.operationKey
    ? settingsOperationConfigs[confirmDialog.operationKey]
    : null;

  const backendState = operations.backendCacheClear;
  const frontendState = operations.frontendRevalidate;
  const backendBadge = getStatusBadge(backendState.status);
  const frontendBadge = getStatusBadge(frontendState.status);

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl tracking-tight">Settings</h1>
        </div>

        <article className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-xl">Maintenance</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Clear Backend Cache */}
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base">Clear Backend Cache</h3>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-1 text-xs",
                    backendBadge.className,
                  )}
                >
                  {backendBadge.text}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Clears backend HTTP cache via{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">
                  /api/http-cache/clear
                </code>
                .
              </p>
              <p className="mt-2 min-h-5 text-xs text-slate-500">
                {backendState.message}
              </p>
              <button
                type="button"
                onClick={() => openConfirm("backendCacheClear")}
                disabled={backendState.status === "loading"}
                className="mt-3 inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {backendState.status === "loading"
                  ? "Running..."
                  : "Run action"}
              </button>
            </div>

            {/* Revalidate Frontend Layout */}
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base">Revalidate Frontend Layout</h3>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-1 text-xs",
                    frontendBadge.className,
                  )}
                >
                  {frontendBadge.text}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Triggers frontend revalidation via{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">
                  /api/revalidate?path=/&amp;type=layout
                </code>
                .
              </p>
              <p className="mt-2 min-h-5 text-xs text-slate-500">
                {frontendState.message}
              </p>
              <button
                type="button"
                onClick={() => openConfirm("frontendRevalidate")}
                disabled={frontendState.status === "loading"}
                className="mt-3 inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {frontendState.status === "loading"
                  ? "Running..."
                  : "Run action"}
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <DialogContent
          className="max-w-md gap-0 overflow-hidden p-0"
          aria-describedby={undefined}
        >
          <div className="space-y-2 p-6">
            <DialogTitle className="text-xl">
              {confirmConfig?.title || "Confirm action"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {confirmConfig?.description || ""}
            </DialogDescription>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border p-6">
            <button
              type="button"
              onClick={closeConfirm}
              className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => runOperation(confirmDialog.operationKey)}
              className="inline-flex items-center rounded-md border border-slate-400 bg-slate-900 px-4 py-2 text-sm text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              {confirmConfig?.confirmLabel || "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

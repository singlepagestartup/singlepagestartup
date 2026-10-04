import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button, Icon, kit, Specimen } from "./primitives";

export default function Feedback() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [toast, setToast] = useState<"saved" | "undone" | null>(null);
  const [toastHovered, setToastHovered] = useState(false);
  const [toastFocused, setToastFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emptyState, setEmptyState] = useState<"empty" | "error" | "retrying">(
    "empty",
  );

  useEffect(() => {
    if (!toast || toastHovered || toastFocused) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast, toastHovered, toastFocused]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      if (progress >= 100) setLoading(false);
      else setProgress((value) => Math.min(100, value + 20));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [loading, progress]);

  useEffect(() => {
    if (emptyState !== "retrying") return;
    const timer = window.setTimeout(() => setEmptyState("empty"), 800);
    return () => window.clearTimeout(timer);
  }, [emptyState]);

  return (
    <div className="grid gap-6">
      <Specimen
        id="alerts"
        title="Alerts"
        description="Inline information stays beside the decision it explains."
        states={["Informational", "Success", "Dismissed"]}
        usage="Use a persistent inline alert when context matters before an action. Do not rely on color alone."
        recipe={`rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4 text-sm ${kit.focus}`}
      >
        <div className="grid gap-3">
          {alertVisible ? (
            <div className="flex items-start gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4 text-sm">
              <Icon name="question" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Your files stay on this device</p>
                <p className={`mt-1 ${kit.muted}`}>
                  This component demo does not send files to a server.
                </p>
              </div>
              <Button
                variant="plain"
                className="min-h-11 shrink-0 px-3"
                aria-label="Dismiss file information"
                onClick={() => setAlertVisible(false)}
              >
                <Icon name="x" />
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setAlertVisible(true)}>
              Show information again
            </Button>
          )}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-4 text-sm">
            <span className="rounded-full bg-[var(--workspace-brand-accent)] p-1 text-[var(--workspace-brand-on-accent)]">
              <Icon name="check" />
            </span>
            <div>
              <p className="font-semibold">Ready to review</p>
              <p className={`mt-1 ${kit.muted}`}>
                A success message names the completed action.
              </p>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="toast"
        title="Toast"
        description="A temporary acknowledgement can offer an immediate undo."
        states={["Hidden", "Visible", "Undone", "Dismissed"]}
        usage="Keep important information in the page too. This local demo dismisses the toast after eight seconds and pauses while hovered or focused. Undo is also available beside its trigger."
        recipe={`${kit.card} flex flex-wrap items-center gap-3 shadow-sm`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setToast("saved")}>
            Simulate saving a draft
          </Button>
          <Button
            variant="secondary"
            disabled={toast !== "saved"}
            onClick={() => setToast("undone")}
          >
            Undo demo save
          </Button>
        </div>
        <div className="mt-4 min-h-20" aria-live="polite" aria-atomic="true">
          {toast ? (
            <div
              className={`${kit.card} flex flex-wrap items-center gap-3 shadow-sm`}
              onPointerEnter={() => setToastHovered(true)}
              onPointerLeave={() => setToastHovered(false)}
              onFocusCapture={() => setToastFocused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setToastFocused(false);
                }
              }}
            >
              <Icon name="check" />
              <p className="min-w-0 flex-1 text-sm font-medium">
                {toast === "saved"
                  ? "Demo draft saved in this preview."
                  : "Demo save undone."}
              </p>
              {toast === "saved" ? (
                <Button variant="plain" onClick={() => setToast("undone")}>
                  Undo
                </Button>
              ) : null}
              <Button
                variant="plain"
                className="px-3"
                aria-label="Dismiss notification"
                onClick={() => {
                  setToast(null);
                  setToastHovered(false);
                  setToastFocused(false);
                }}
              >
                <Icon name="x" />
              </Button>
            </div>
          ) : (
            <p className={`text-sm ${kit.muted}`}>
              No notification. Nothing is saved outside this preview.
            </p>
          )}
        </div>
      </Specimen>

      <Specimen
        id="loading"
        title="Loading and skeleton"
        description="A local timer demonstrates progress while the content layout stays stable."
        states={["Idle", "Loading", "Complete", "Reduced motion"]}
        usage="Use a skeleton for unknown content and progress only when the amount completed is known."
        recipe="h-2 overflow-hidden rounded-full bg-[var(--workspace-brand-line)] / animate-pulse motion-reduce:animate-none"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${kit.card} space-y-4`}>
            <Button
              disabled={loading}
              onClick={() => {
                setProgress(0);
                setLoading(true);
              }}
            >
              {loading ? (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
                />
              ) : (
                <Icon name="arrow-right" />
              )}
              {loading ? "Simulating…" : "Run loading demo"}
            </Button>
            <progress
              className="h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-[var(--workspace-brand-primary)] [&::-webkit-progress-bar]:bg-[var(--workspace-brand-line)] [&::-webkit-progress-value]:bg-[var(--workspace-brand-primary)]"
              aria-label="Demo progress"
              max={100}
              value={progress}
            />
            <p role="status" className={`text-sm ${kit.muted}`}>
              {loading
                ? `${progress}% · local simulation`
                : progress === 100
                  ? "Demo complete."
                  : "Ready to simulate."}
            </p>
          </div>
          <div
            className={`${kit.card} space-y-4`}
            aria-label="Skeleton example"
            aria-busy={loading}
          >
            <div
              aria-hidden="true"
              className={
                loading
                  ? "space-y-4 animate-pulse motion-reduce:animate-none"
                  : "space-y-4"
              }
            >
              <div className="h-8 w-8 rounded-lg bg-[var(--workspace-brand-line)]" />
              <div className="h-3 w-2/3 rounded-full bg-[var(--workspace-brand-line)]" />
              <div className="h-3 w-full rounded-full bg-[var(--workspace-brand-background)]" />
              <div className="h-3 w-4/5 rounded-full bg-[var(--workspace-brand-background)]" />
            </div>
            <p className={`text-xs ${kit.muted}`}>Content skeleton preview</p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="empty-error"
        title="Empty and error states"
        description="Explain what happened and offer the next useful action."
        states={["Empty", "Failed", "Retrying", "Recovered"]}
        usage="An empty collection needs an invitation. A failed request needs an explanation and retry, without discarding existing work."
        recipe={`${kit.card} grid justify-items-center gap-3 py-8 text-center; error: border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)]`}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setEmptyState("empty")}>
            Show empty
          </Button>
          <Button variant="secondary" onClick={() => setEmptyState("error")}>
            Simulate an error
          </Button>
        </div>
        <div
          className={twMerge(
            kit.card,
            "grid justify-items-center gap-3 py-8 text-center",
            emptyState !== "empty" &&
              "border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)]",
          )}
          role={emptyState === "error" ? "alert" : undefined}
          aria-busy={emptyState === "retrying"}
        >
          <Icon
            name={emptyState === "empty" ? "folder-open" : "question"}
            size={24}
          />
          <p className="font-semibold">
            {emptyState === "empty"
              ? "No files in this demo"
              : emptyState === "error"
                ? "The example could not load"
                : "Trying the example again…"}
          </p>
          <p
            role="status"
            className={`max-w-md text-sm ${emptyState === "empty" ? kit.muted : "text-[var(--workspace-brand-danger)]"}`}
          >
            {emptyState === "empty"
              ? "Add a local file in the File upload example below."
              : "This is a simulated failure. Your local files have not changed."}
          </p>
          {emptyState !== "empty" ? (
            <Button
              variant="secondary"
              className="border-[var(--workspace-brand-danger-line)] text-[var(--workspace-brand-danger)] enabled:hover:bg-[var(--workspace-brand-danger-surface)] focus-visible:outline-[var(--workspace-brand-danger)]"
              disabled={emptyState === "retrying"}
              onClick={() => setEmptyState("retrying")}
            >
              {emptyState === "retrying" ? "Retrying…" : "Retry demo"}
            </Button>
          ) : null}
        </div>
      </Specimen>
    </div>
  );
}

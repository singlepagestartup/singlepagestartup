"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Toaster, ToastIcon, toast } from "@sps/ui-adapter/toast";
import type { IComponentPropsExtended } from "./interface";

export function Component({
  variant = "default",
  type = "success",
  title = "Profile saved",
  description = "Your profile changes have been saved.",
  actionLabel = "",
  persistent = true,
  duration = 4500,
  position = "bottom-right",
  appearance = "single",
}: IComponentPropsExtended) {
  const prefix = useId();
  const generation = useRef(0);
  const active = useRef<string[]>([]);
  const [action, setAction] = useState("");
  const dismiss = useCallback(() => {
    active.current.forEach((id) => toast.dismiss(id));
    active.current = [];
  }, []);
  const show = useCallback(() => {
    dismiss();
    setAction("");
    generation.current++;
    const states =
      appearance === "single"
        ? [type]
        : appearance === "all"
          ? ([
              "default",
              "success",
              "error",
              "warning",
              "info",
              "loading",
            ] as const)
          : (["success", "info", "warning"] as const);
    for (const state of states) {
      const id = `${prefix}-${generation.current}-${state}`;
      active.current.push(id);
      const send = state === "default" ? toast.message : toast[state];
      send(
        appearance === "single"
          ? title
          : state === "loading"
            ? "Saving changes"
            : state === "error"
              ? "Changes could not be saved"
              : state === "warning"
                ? "Review before continuing"
                : state === "info"
                  ? "Your document is ready"
                  : state === "success"
                    ? "Changes saved"
                    : "New notification",
        {
          id,
          description,
          duration: persistent ? Infinity : duration,
          icon: state === "default" ? <ToastIcon type="default" /> : undefined,
          action: actionLabel
            ? {
                label: actionLabel,
                onClick: () => {
                  setAction(
                    "Preview action completed. No application data was changed.",
                  );
                },
              }
            : undefined,
        },
      );
    }
  }, [
    dismiss,
    prefix,
    type,
    appearance,
    title,
    description,
    persistent,
    duration,
    actionLabel,
  ]);
  useEffect(() => {
    show();
    return dismiss;
  }, [show, dismiss]);
  return (
    <main
      data-module="shared"
      data-model="toast"
      data-variant={variant}
      className={
        "min-h-screen bg-muted px-6 py-10 font-default text-foreground sm:px-10" +
        (appearance === "all" ? " grid content-start gap-8 xl:grid-cols-2" : "")
      }
    >
      <div className="max-w-xl space-y-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared / Toast
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Notifications</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The same notification renderer is used here and in the application.
            Edit the message, state and position in Controls.
          </p>
        </header>
        <section className="rounded-xl border border-border bg-card p-5 text-sm leading-6">
          <h2 className="font-semibold">Preview controls</h2>
          <p className="mt-2 text-muted-foreground">
            Notifications stay visible while Persistent is enabled. Loading
            remains visible until the operation completes. These examples do not
            send API requests.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={show}
              className="min-h-11 rounded-xl bg-primary px-4 font-medium text-primary-foreground"
            >
              Show notification
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 rounded-xl border border-border px-4 font-medium"
            >
              Dismiss notification
            </button>
            {type === "loading" && appearance === "single" ? (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-border px-4 font-medium"
                onClick={() => {
                  if (active.current[0])
                    toast.success("Changes saved", {
                      id: active.current[0],
                      description: "The preview operation is complete.",
                      duration: persistent ? Infinity : duration,
                    });
                }}
              >
                Complete operation
              </button>
            ) : null}
          </div>
          {action ? (
            <p role="status" className="mt-4 text-muted-foreground">
              {action}
            </p>
          ) : null}
        </section>
        <p className="text-xs leading-5 text-muted-foreground">
          Icons: Phosphor Regular. Card, text and border use the current SPS
          theme. Success uses the primary accent; errors use the destructive
          accent.
        </p>
      </div>
      <Toaster
        className={
          appearance === "all"
            ? "!static !m-0 !grid !w-full !max-w-none !list-none !grid-cols-1 !gap-4 !p-0 !transform-none sm:!grid-cols-2 [&>li]:!relative [&>li]:!inset-auto [&>li]:!h-auto [&>li]:!transform-none [&>li]:!opacity-100"
            : undefined
        }
        position={position}
        duration={persistent ? Infinity : duration}
        expand={appearance === "all"}
        visibleToasts={appearance === "all" ? 6 : 3}
      />
    </main>
  );
}

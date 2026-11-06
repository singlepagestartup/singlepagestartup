"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { ICopyRequestViewProps } from "./interface";
interface ICopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  recordId: string;
  title: string;
  text: string;
}
export function Component({
  recordId,
  title,
  text,
  description,
  className,
  dataClassName,
  copyLabel,
  pendingLabel,
  successLabel,
  errorLabel,
  idleLabel,
  emptyLabel,
}: ICopyRequestViewProps) {
  const [feedback, setFeedback] = useState<ICopyFeedback>({
    state: "idle",
    recordId,
    title,
    text,
  });
  const revision = useRef(0);
  const empty = !text.trim();
  const status =
    !empty &&
    feedback.recordId === recordId &&
    feedback.title === title &&
    feedback.text === text
      ? feedback.state
      : "idle";
  useEffect(() => {
    revision.current += 1;
    setFeedback({ state: "idle", recordId, title, text });
    return () => {
      revision.current += 1;
    };
  }, [recordId, title, text]);
  const copy = async () => {
    if (empty || status === "pending") return;
    const currentRevision = revision.current;
    setFeedback({ state: "pending", recordId, title, text });
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (revision.current !== currentRevision) return;
      setFeedback({ state: "success", recordId, title, text });
    } catch {
      if (revision.current !== currentRevision) return;
      setFeedback({ state: "error", recordId, title, text });
    }
  };
  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-id={recordId}
      data-variant="copy-request"
      className={cn(
        "w-full rounded-2xl bg-muted p-5 text-foreground @3xl:p-6",
        dataClassName,
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon name="file-text" size={20} />
          {title}
        </p>
        <button
          type="button"
          onClick={copy}
          disabled={empty || status === "pending"}
          aria-busy={status === "pending"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "success" ? <Icon name="check" size={20} /> : null}
          {status === "pending" ? pendingLabel : copyLabel}
        </button>
      </div>
      <blockquote className="mt-5 select-text rounded-xl border border-border bg-background p-4 text-sm leading-6 @3xl:text-base @3xl:leading-7 [&_.prose]:text-foreground">
        {description}
      </blockquote>
      <p
        className={cn(
          "mt-3 min-h-5 text-xs leading-5",
          status === "error" ? "text-destructive" : "text-muted-foreground",
        )}
        role="status"
        aria-live="polite"
      >
        {empty
          ? emptyLabel
          : status === "success"
            ? successLabel
            : status === "error"
              ? errorLabel
              : idleLabel}
      </p>
    </div>
  );
}

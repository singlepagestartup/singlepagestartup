"use client";

import { useEffect, useRef, useState } from "react";
import type { IComponentProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";

interface ICopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  title: string;
  description: string;
}

export function Component({
  title,
  description,
  copyLabel,
  pendingLabel,
  successLabel,
  errorLabel,
  idleLabel,
}: IComponentProps) {
  const [feedback, setFeedback] = useState<ICopyFeedback>({
    state: "idle",
    title,
    description,
  });
  const revision = useRef(0);
  const empty = !description.trim();
  const status =
    !empty && feedback.title === title && feedback.description === description
      ? feedback.state
      : "idle";
  useEffect(() => {
    revision.current += 1;
    setFeedback({ state: "idle", title, description });
    return () => {
      revision.current += 1;
    };
  }, [title, description]);
  const copy = async () => {
    if (empty || status === "pending") return;
    const currentRevision = revision.current;
    setFeedback({ state: "pending", title, description });
    try {
      await navigator.clipboard.writeText(description);
      if (revision.current !== currentRevision) return;
      setFeedback({ state: "success", title, description });
    } catch {
      if (revision.current !== currentRevision) return;
      setFeedback({ state: "error", title, description });
    }
  };
  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-variant="copy-request"
      data-ds-block="website-builder.feature.copy-request"
      className="rounded-2xl bg-muted p-5 text-foreground @3xl:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <SharedIcon variant="phosphor" name="code" size={20} />
          {title}
        </p>
        <button
          type="button"
          onClick={copy}
          disabled={empty || status === "pending"}
          aria-busy={status === "pending"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "success" ? (
            <SharedIcon variant="phosphor" name="check" size={20} />
          ) : null}
          {status === "pending" ? pendingLabel : copyLabel}
        </button>
      </div>
      <blockquote className="mt-5 select-text rounded-xl border border-border bg-background p-4 text-sm leading-6 @3xl:text-base @3xl:leading-7">
        {description}
      </blockquote>
      <p
        className={`mt-3 min-h-5 text-xs leading-5 ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        role="status"
        aria-live="polite"
      >
        {empty
          ? idleLabel
          : status === "success"
            ? successLabel
            : status === "error"
              ? errorLabel
              : idleLabel}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Component as SharedIcon } from "../../../../../../../../../../../../../../../../shared/icon";
import type { IDevelopmentHandoffProps } from "./interface";

interface ICopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  text: string;
}

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function DevelopmentHandoff({
  fileName,
  revision,
  hasContent,
  hasPendingProposal,
}: IDevelopmentHandoffProps) {
  const id = useId();
  const generation = useRef(0);
  const [feedback, setFeedback] = useState<ICopyFeedback>({
    state: "idle",
    text: "",
  });
  useEffect(() => {
    generation.current += 1;
    setFeedback((current) =>
      current.state === "idle" && !current.text
        ? current
        : { state: "idle", text: "" },
    );
    return () => {
      generation.current += 1;
    };
  }, [fileName, revision, hasContent, hasPendingProposal]);

  async function copyRequest() {
    if (!hasContent || feedback.state === "pending") return;
    const currentGeneration = generation.current;
    setFeedback({ state: "pending", text: "Copying development request…" });
    const request = [
      "Use SinglePageStartup Code Framework to plan a first landing page or web product.",
      `Read the attached ${fileName} document. I must review its saved text, save any notes I want included, then export and attach the file separately. Unsaved edits and unconfirmed proposals are not part of the saved export.`,
      "Treat unanswered facts and assumptions as open questions. Ask me before filling them in.",
      "My first customer action: [describe the one action a visitor should be able to complete].",
      "Inspect the existing modules, identify the smallest useful first change and show me the plan before changing code.",
      "Use the framework's existing account, content, order or payment flows where the task needs them. Preserve their current behavior.",
      "Show the result and the checks I should review before the next change.",
    ].join("\n\n");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(request);
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "success",
        text: `Request copied. Review and save the text you want, export ${fileName}, then attach that file in your coding agent.`,
      });
    } catch {
      if (generation.current !== currentGeneration) return;
      setFeedback({
        state: "error",
        text: "The request could not be copied. Allow clipboard access and try again. The document’s export action is still available.",
      });
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-ds-block="rbac.subject.document-development-handoff"
      className="mt-5 rounded-2xl border border-border bg-card p-4 @xl:p-5"
    >
      <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <SharedIcon variant="phosphor" name="code" />
        From documents to development
      </p>
      <h4 id={`${id}-title`} className="mt-3 text-xl font-semibold leading-7">
        Ready to turn this document into a product?
      </h4>
      <p
        id={`${id}-description`}
        className="mt-3 text-sm leading-6 text-muted-foreground"
      >
        Review the facts and open questions, save any notes you want to include,
        then export {fileName} with the document’s download action. Give the
        file to your coding agent and use Code Framework for the accounts,
        content, orders or payments your product needs.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Editable text is not automatically reviewed. The saved export excludes
        unsaved notes and unconfirmed proposals. Copying adds instructions to
        your clipboard; attach the exported file separately.
      </p>
      {hasPendingProposal ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          An unconfirmed proposal is waiting in chat. Review it before choosing
          which saved text to export.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyRequest}
          disabled={!hasContent || feedback.state === "pending"}
          aria-busy={feedback.state === "pending"}
          aria-describedby={`${id}-description ${id}-feedback`}
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-normal rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground transition motion-reduce:transition-none enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
        >
          <SharedIcon
            variant="phosphor"
            name={feedback.state === "success" ? "check" : "file-text"}
          />
          {feedback.state === "pending"
            ? "Copying request…"
            : "Copy development request"}
        </button>
        <a
          href="/?path=/story/modules-host-models-page-singlepage-framework--default"
          target="_top"
          className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold text-foreground hover:underline ${focus}`}
        >
          Explore Code Framework
          <SharedIcon variant="phosphor" name="arrow-up-right" />
        </a>
      </div>
      <p
        id={`${id}-feedback`}
        role={feedback.state === "error" ? "alert" : "status"}
        aria-live={feedback.state === "error" ? "assertive" : "polite"}
        className={`mt-3 min-h-6 text-sm leading-6 ${feedback.state === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {hasContent
          ? feedback.text
          : "Save document text before copying a development request."}
      </p>
    </section>
  );
}

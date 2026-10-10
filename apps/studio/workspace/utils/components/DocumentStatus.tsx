import type { ReactNode } from "react";

import type { IDocumentConfirmation } from "../../../../../tools/studio/workspace/document";

/**
 * One line per document kind: what it decides, and what breaks when it is wrong.
 *
 * The owner reviews these pages in order without knowing the framework, so the
 * header answers the only question they have on opening one, which is whether
 * to read it. Restating the document below it, or explaining how to use it,
 * costs a line and answers nothing.
 */
const purposes: Record<string, string> = {
  brief:
    "Everything the client stated and everything still unknown. A wrong answer here misdirects every later decision.",
  model:
    "Shared resources, per-product prices, costs and funding. Wrong here, and every product's numbers are wrong.",
  strategy:
    "The marketing system the Brief has to add up to. Wrong, and brand, design and product priorities aim at the wrong opportunity.",
  brand:
    "What the business means, promises and sounds like, and how far its proof reaches.",
  design:
    "The visual system every product inherits: identity, type, color, interface, photography, illustration.",
  analytics:
    "What was observed, with the window and source of each number. Research does the interpreting.",
  research:
    "External evidence on segments, competitors and alternatives, with its limits. Product and Sales cite it; it decides nothing on its own.",
  sales:
    "The whole customer process for this product, from first contact to continued use.",
  product:
    "This product's customer, problem, value and offer. Its website, campaigns and deck all apply it.",
  website:
    "What a visitor has to understand and do, page by page, before implementation starts.",
  creative:
    "The campaign messages, formats and assets selected for this product.",
  "asset-index":
    "Every supplied and generated file, with its origin, rights and review state.",
};

export function documentPurpose(kind: string, fallback = "") {
  return { purpose: purposes[kind] ?? fallback };
}

export interface IDocumentHeaderProps {
  actions?: ReactNode;
  confirmation?: IDocumentConfirmation;
  title: string;
  titleId?: string;
  purpose: string;
}

export function DocumentHeader({
  actions,
  confirmation,
  title,
  titleId,
  purpose,
}: IDocumentHeaderProps) {
  return (
    <header className="mb-8 w-full rounded-3xl bg-[var(--workspace-brand-primary)] p-7 text-[var(--workspace-brand-on-primary)] md:p-10">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:flex-wrap">
        <div className="min-w-0 w-full flex-1 sm:w-auto">
          {confirmation ? (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-normal">
              <ConfirmationBadge confirmation={confirmation} />
            </div>
          ) : null}
          <h1
            id={titleId}
            className="text-3xl font-semibold tracking-tight md:text-5xl"
          >
            {title}
          </h1>
          {purpose ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)] md:text-base">
              {purpose}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function ConfirmationBadge({
  confirmation,
}: {
  confirmation: IDocumentConfirmation;
}) {
  const label =
    confirmation.state === "stale"
      ? "Needs review"
      : confirmation.state === "confirmed"
        ? "Confirmed"
        : "Needs confirmation";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        confirmation.confirmed
          ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]"
          : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]"
      }`}
      title={
        confirmation.state === "stale"
          ? `${confirmation.reason ?? "Upstream inputs require review."} Sources: ${confirmation.sources?.join(", ") ?? "unknown"}`
          : confirmation.state === "changed"
            ? "The current text does not match a complete recorded confirmation."
            : confirmation.confirmed
              ? `${confirmation.by} · ${confirmation.at}. Applies to the ${confirmation.layer} document.`
              : "No confirmation of this document has been recorded."
      }
    >
      {label}
    </span>
  );
}

export function DocumentReviewToolbar({
  actions,
  confirmation,
  note,
}: {
  actions?: ReactNode;
  confirmation?: IDocumentConfirmation;
  note?: ReactNode;
}) {
  return (
    <>
      <div
        className="bg-[var(--workspace-brand-background)] px-5 py-4 md:px-10"
        data-document-toolbar
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {confirmation ? (
              <ConfirmationBadge confirmation={confirmation} />
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
        {note ? (
          <div className="mt-3 text-sm text-[var(--workspace-brand-muted)]">
            {note}
          </div>
        ) : null}
      </div>
      <hr className="border-0 border-t border-[var(--workspace-brand-line)]" />
    </>
  );
}

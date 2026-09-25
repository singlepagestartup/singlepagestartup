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
  purpose: string;
}

export function DocumentHeader({
  actions,
  confirmation,
  title,
  purpose,
}: IDocumentHeaderProps) {
  return (
    <header className="mb-8 w-full rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {confirmation ? (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <ConfirmationBadge confirmation={confirmation} />
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          {purpose ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
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
          ? "border-emerald-300 bg-emerald-100 text-emerald-950"
          : "border-amber-300 bg-amber-100 text-amber-950"
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
      <div className="bg-slate-50 px-5 py-4 md:px-10" data-document-toolbar>
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
          <div className="mt-3 text-sm text-slate-500">{note}</div>
        ) : null}
      </div>
      <hr className="border-0 border-t border-slate-200" />
    </>
  );
}

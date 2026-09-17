import type { ReactNode } from "react";

import type { IDocumentConfirmation } from "../../../../../tools/studio/workspace/document";

const purposes: Record<string, { purpose: string; usage: string }> = {
  brief: {
    purpose:
      "Captures the client's request, products, goals, constraints, and supplied materials.",
    usage:
      "Use it to agree on the project scope and identify the client answers needed before making decisions.",
  },
  model: {
    purpose:
      "Explains the linked model's revenue, funding, resources, activities, partnerships and costs.",
    usage:
      "Edit common facts here once. Per-product terms retain their product IDs; Sales owns the complete customer process.",
  },
  strategy: {
    purpose:
      "Defines the project's intended final marketing system using the Brief and external research.",
    usage:
      "Use it to review how audiences, product roles, channels, customer journeys, and measurable outcomes work together in the target state.",
  },
  brand: {
    purpose:
      "Defines how the business should be understood: its meaning, promise, voice, and evidence boundaries.",
    usage:
      "Use it to keep product messages, visual design, and marketing consistent with the confirmed brand direction.",
  },
  design: {
    purpose:
      "Translates the brand and client references into reusable identity, typography, color, interface, photography, and illustration rules.",
    usage:
      "Use it to review the visual direction before applying it to product pages, campaigns, and presentations.",
  },
  analytics: {
    purpose:
      "Collects current funnel, usage, revenue, and cost observations with their periods and sources.",
    usage:
      "Use it to see what is actually happening before Research interprets the evidence and Product decisions change.",
  },
  research: {
    purpose:
      "Checks each customer segment's needs, motives, acquisition and journey against evidence, and compares competing offers.",
    usage:
      "Use the findings, sources and limitations to refine Sales, positioning, website copy and marketing messages.",
  },
  sales: {
    purpose:
      "Connects customer needs and buying motives with acquisition, decisions, and continued use.",
    usage:
      "Use the segment profiles and Customer Journey Maps (CJM) to shape relevant website copy, marketing messages, and customer relationships.",
  },
  product: {
    purpose:
      "Defines this product's customer, problem, value, offer, and evidence boundaries.",
    usage:
      "Use it as the common brief for Sales, promotional materials, measurement, and Research decisions.",
  },
  website: {
    purpose:
      "Specifies this product's visitor journey, page content, interactions, and conversion path.",
    usage:
      "Use it to review what visitors must understand and do before website implementation starts.",
  },
  creative: {
    purpose:
      "Defines this product's selected marketing messages, formats, assets, and destinations.",
    usage:
      "Use it to review the campaign materials against the product offer, brand, and available proof.",
  },
  "asset-index": {
    purpose:
      "Registers supplied and generated files, their origins, usage rights, and review states.",
    usage:
      "Use it to select permitted assets and trace the source of each visual or document.",
  },
};

export function documentPurpose(kind: string, fallback = "") {
  return (
    purposes[kind] ?? {
      purpose: fallback,
      usage:
        "Use this document as the current reference for its decisions and constraints.",
    }
  );
}

export interface IDocumentHeaderProps {
  actions?: ReactNode;
  confirmation?: IDocumentConfirmation;
  title: string;
  purpose: string;
  usage: string;
}

export function DocumentHeader({
  actions,
  confirmation,
  title,
  purpose,
  usage,
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
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            {purpose}
          </p>
        </div>
        {actions}
      </div>
      <p className="mt-6 text-xs leading-5 text-slate-400">{usage}</p>
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

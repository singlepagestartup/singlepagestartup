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
      "Defines the project's marketing goals, audiences, positioning, channels, and growth using the Brief and external research.",
    usage:
      "Use it to align product roles, acquisition, conversion, continued use, and measurable outcomes.",
  },
  brand: {
    purpose:
      "Defines how the business should be understood: its meaning, promise, voice, and evidence boundaries.",
    usage:
      "Use it to keep product messages, visual design, and marketing consistent with the confirmed brand direction.",
  },
  design: {
    purpose:
      "Translates the brand and client references into reusable identity, typography, color, photography, and illustration rules.",
    usage:
      "Use it to review the visual direction before applying it to product pages, campaigns, and presentations.",
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
      "Use it as the common brief for this product's website, marketing creative, and presentation.",
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
  confirmation?: IDocumentConfirmation;
  title: string;
  purpose: string;
  usage: string;
}

export function DocumentHeader({
  confirmation,
  title,
  purpose,
  usage,
}: IDocumentHeaderProps) {
  return (
    <header className="mb-8 w-full rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
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
      ? "Stale · review upstream changes"
      : confirmation.state === "confirmed"
        ? "Confirmed by user"
        : confirmation.state === "changed"
          ? "Needs confirmation again"
          : "Not confirmed by user";
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
      {label} · {confirmation.layer}
    </span>
  );
}

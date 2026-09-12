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
      "Selects the product priorities, audience, positioning, and first experiment using the client facts and product research.",
    usage:
      "Use it to agree on what to pursue, what to defer, and which results will determine the next decision.",
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
      "Examines this product's buyers, alternatives, prices, channels, and unresolved hypotheses.",
    usage:
      "Use the dated sources and their limitations to choose the product strategy. Confirmation records review, not proof of demand.",
  },
  sales: {
    purpose:
      "Records this product's sales and delivery process, owners, conditions, and unresolved operational details.",
    usage:
      "Use it to check that the offer, payment, delivery, and support promises have a workable process behind them.",
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

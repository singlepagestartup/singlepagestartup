import { useEffect, useState } from "react";

import type {
  IPortfolioCatalogView,
  IPortfolioDocument,
} from "../portfolio/source";
import { MarkdownDocument } from "./ArtifactBrowser";

const roleLabels = {
  "audience-program": "Audience growth program",
  "internal-operation": "Internal operation",
  product: "Sellable product",
} as const;

export function PortfolioCatalog({ view }: { view: IPortfolioCatalogView }) {
  const [selectedDirectionId, setSelectedDirectionId] = useState(
    view.directions[0]?.entry.id ?? "",
  );
  const [selectedKind, setSelectedKind] =
    useState<IPortfolioDocument["kind"]>("research");

  useEffect(() => {
    setSelectedDirectionId(view.directions[0]?.entry.id ?? "");
    setSelectedKind("research");
  }, [view]);

  if (!view.directions.length) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950 md:p-10">
        <section className="w-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            00 Business · Portfolio
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            No startup portfolio
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            The empty startup layer inherits the complete singlepage portfolio
            in default. Add a complete startup manifest only after the operator
            confirms every direction and its role.
          </p>
        </section>
      </main>
    );
  }

  const direction =
    view.directions.find(({ entry }) => entry.id === selectedDirectionId) ??
    view.directions[0];
  const document =
    direction.documents.find(({ kind }) => kind === selectedKind) ??
    direction.documents[0];

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10">
      <header className="mb-8 w-full rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="rounded-full bg-teal-400 px-3 py-1 text-slate-950">
            00 Business · Portfolio
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">
            {view.label}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
          Portfolio
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          One complete inventory separates sellable products, audience-growth
          programs, internal operations, and future or deferred directions.
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 pt-5 md:px-8">
          <div className="flex gap-2 overflow-x-auto pb-4" role="tablist">
            {view.directions.map(({ entry }) => (
              <button
                aria-selected={entry.id === direction.entry.id}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                  entry.id === direction.entry.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                key={entry.id}
                onClick={() => {
                  setSelectedDirectionId(entry.id);
                  setSelectedKind("research");
                }}
                role="tab"
                type="button"
              >
                {entry.name}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-slate-200 px-5 pt-6 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-2xl font-semibold">
              {direction.entry.name}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {roleLabels[direction.entry.role]}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {direction.entry.lifecycle}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {direction.entry.summary}
          </p>
          <nav
            className="mt-5 flex gap-1 overflow-x-auto"
            aria-label="Direction documents"
          >
            {direction.documents.map((candidate) => (
              <button
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
                  candidate.kind === document.kind
                    ? "border-teal-600 text-slate-950"
                    : "border-transparent text-slate-500"
                }`}
                key={candidate.kind}
                onClick={() => setSelectedKind(candidate.kind)}
                type="button"
              >
                {candidate.label}
              </button>
            ))}
          </nav>
        </div>

        <article className="px-5 py-7 md:px-10 md:py-10">
          <MarkdownDocument>{document.content}</MarkdownDocument>
          <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <span className="block font-semibold uppercase tracking-wide text-slate-900">
              Source
            </span>
            <code className="mt-1 block break-all">{document.sourcePath}</code>
          </div>
        </article>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";

import type {
  IProductCatalogView,
  IProductDocument,
  IProductView,
} from "../products/source";
import { MarkdownDocument } from "./ArtifactBrowser";

type ProductSection = IProductDocument["kind"] | "content" | "presentation";

const coreSections: Array<{ id: ProductSection; label: string }> = [
  { id: "research", label: "01 Research" },
  { id: "sales", label: "02 Sales" },
  { id: "product", label: "03 Product Overview" },
  { id: "website", label: "04 Website" },
  { id: "creative", label: "05 Marketing Creative" },
  { id: "presentation", label: "06 Presentation" },
];

function sections(product: IProductView) {
  return product.content
    ? [...coreSections, { id: "content" as const, label: "07 Content" }]
    : coreSections;
}

function requestedPresentation(view: IProductCatalogView) {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  if (params.get("document") !== "presentation") return undefined;
  const requestedId = params.get("product");
  return view.products.find(({ id }) => id === requestedId) ?? view.products[0];
}

export function ProductCatalog({ view }: { view: IProductCatalogView }) {
  const directPresentation = requestedPresentation(view);
  const [selectedProductId, setSelectedProductId] = useState(
    view.products[0]?.id ?? "",
  );
  const [selectedSection, setSelectedSection] =
    useState<ProductSection>("research");

  useEffect(() => {
    setSelectedProductId(view.products[0]?.id ?? "");
    setSelectedSection("research");
  }, [view]);

  if (directPresentation) {
    const { Component, data } = directPresentation.presentation;
    return <Component data={data} />;
  }

  if (!view.products.length) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950 md:p-10">
        <section className="w-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            40 Products · startup source
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            No startup products
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            This is the expected initial state. The default view inherits the
            complete singlepage catalog until startup defines its first product.
            After that, startup replaces the entire catalog instead of mixing
            niches.
          </p>
          <code className="mt-6 inline-block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
            apps/studio/workspace/products/startup.yaml
          </code>
        </section>
      </main>
    );
  }

  const product =
    view.products.find(({ id }) => id === selectedProductId) ??
    view.products[0];
  const document = product.documents.find(
    ({ kind }) => kind === selectedSection,
  );
  const Presentation = product.presentation.Component;
  const Content = product.content?.Component;
  const Website = product.websiteComponent?.Component;

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10">
      <header className="mb-8 w-full rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="rounded-full bg-teal-400 px-3 py-1 text-slate-950">
            40 Products
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">
            {view.label}
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">
            changes frequently · local impact
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
          Products
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          Review one product at a time: its market evidence, sales process,
          offer, website, creative, presentation, and product-specific content.
          Shared Business, Strategy, Brand, and Design remain common inputs.
        </p>
      </header>

      <div className="grid w-full gap-6">
        <section
          aria-labelledby={`product-tab-${product.id}`}
          className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          id="product-panel"
          role="tabpanel"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 pt-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Products
            </p>
            <div
              aria-label="Products"
              className="mt-3 flex gap-2 overflow-x-auto pb-4"
              role="tablist"
            >
              {view.products.map((candidate) => (
                <button
                  aria-controls="product-panel"
                  aria-selected={candidate.id === product.id}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    candidate.id === product.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                  }`}
                  id={`product-tab-${candidate.id}`}
                  key={candidate.id}
                  onClick={() => {
                    setSelectedProductId(candidate.id);
                    setSelectedSection("research");
                  }}
                  role="tab"
                  title={candidate.summary}
                  type="button"
                >
                  {candidate.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-200 px-5 pt-6 md:px-8">
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {product.name}
              </p>
              <p className="w-full text-sm leading-6 text-slate-600">
                {product.summary}
              </p>
            </div>
            <nav
              className="mt-5 flex gap-1 overflow-x-auto"
              aria-label="Product documents"
            >
              {sections(product).map((section) => (
                <button
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
                    selectedSection === section.id
                      ? "border-teal-600 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  type="button"
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {selectedSection === "website" && Website ? (
            <div className="overflow-x-auto bg-black">
              <Website />
            </div>
          ) : selectedSection === "presentation" ? (
            <div className="overflow-x-auto bg-black">
              <Presentation data={product.presentation.data} />
            </div>
          ) : selectedSection === "content" && Content ? (
            <div className="overflow-x-auto bg-black">
              <Content />
            </div>
          ) : document ? (
            <article className="px-5 py-7 md:px-10 md:py-10">
              <MarkdownDocument>{document.content}</MarkdownDocument>
              <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
                <span className="block font-semibold uppercase tracking-wide text-slate-900">
                  Source
                </span>
                <code className="mt-1 block break-all">
                  {document.sourcePath}
                </code>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}

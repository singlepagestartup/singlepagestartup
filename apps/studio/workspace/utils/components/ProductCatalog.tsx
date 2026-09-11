import { useEffect, useState } from "react";

import type { IProductCatalogView, IProductView } from "../products/source";
import { MarkdownDocument } from "./ArtifactBrowser";
import { ConfirmationBadge, documentPurpose } from "./DocumentStatus";
import { PresentationPdfDownload } from "./PresentationPdfDownload";
import { ProductPages } from "./ProductPages";

type ProductSection = string;

const coreSections: Array<{ id: ProductSection; label: string }> = [
  { id: "product", label: "01 Product Overview" },
  { id: "research", label: "02 Research" },
  { id: "sales", label: "03 Sales" },
  { id: "website", label: "04 Website" },
  { id: "creative", label: "05 Marketing Creative" },
  { id: "presentation", label: "06 Presentation" },
];

function sections(product: IProductView) {
  const builtIn = product.content
    ? [...coreSections, { id: "content" as const, label: "07 Content" }]
    : coreSections;
  return [
    ...builtIn,
    ...product.sections
      .filter((section) => !builtIn.some(({ id }) => id === section.id))
      .map((section, index) => ({
        id: section.id,
        label: `${String(builtIn.length + index + 1).padStart(2, "0")} ${section.title}`,
      })),
  ];
}

function requestedPresentation(view: IProductCatalogView) {
  if (typeof window === "undefined") {
    return undefined;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("document") !== "presentation") {
    return undefined;
  }
  const requestedId = params.get("product");
  if (!requestedId) return view.products[0];
  const product = view.products.find(({ id }) => id === requestedId);
  if (!product)
    throw new Error(`Product ${requestedId} is not in the selected catalog`);
  return product;
}

export function ProductCatalog({ view }: { view: IProductCatalogView }) {
  const directPresentation = requestedPresentation(view);
  const [selectedProductId, setSelectedProductId] = useState(
    view.products[0]?.id ?? "",
  );
  const [selectedSection, setSelectedSection] =
    useState<ProductSection>("product");

  useEffect(() => {
    setSelectedProductId(view.products[0]?.id ?? "");
    setSelectedSection("product");
  }, [view]);

  if (directPresentation) {
    const { Component, content } = directPresentation.presentation;
    return <Component content={content} />;
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
            apps/studio/workspace/products/startup/catalog.yaml
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
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Products
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          Defines who each product is for, what customers receive, and how it is
          sold. Research provides the basis for these decisions, which guide the
          website, marketing materials, and presentation.
        </p>
      </header>

      <div className="w-full min-w-0">
        <div
          aria-label="Products"
          className="relative z-10 -mb-px flex gap-1 overflow-x-auto px-px pt-1"
          onKeyDown={(event) => {
            if (
              !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
            ) {
              return;
            }
            event.preventDefault();
            const currentIndex = view.products.findIndex(
              ({ id }) => id === product.id,
            );
            const nextIndex =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? view.products.length - 1
                  : (currentIndex +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      view.products.length) %
                    view.products.length;
            setSelectedProductId(view.products[nextIndex].id);
            setSelectedSection("product");
            event.currentTarget
              .querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [nextIndex]?.focus();
          }}
          role="tablist"
        >
          {view.products.map((candidate) => (
            <button
              aria-controls="product-panel"
              aria-selected={candidate.id === product.id}
              className={`shrink-0 whitespace-nowrap rounded-t-xl border px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-teal-600 ${
                candidate.id === product.id
                  ? "border-slate-200 border-b-white bg-white text-slate-950"
                  : "border-transparent bg-slate-200/60 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
              }`}
              id={`product-tab-${candidate.id}`}
              key={candidate.id}
              onClick={() => {
                setSelectedProductId(candidate.id);
                setSelectedSection("product");
              }}
              role="tab"
              tabIndex={candidate.id === product.id ? 0 : -1}
              title={candidate.summary}
              type="button"
            >
              {candidate.name}
            </button>
          ))}
        </div>
        <section
          aria-labelledby={`product-tab-${product.id}`}
          className="min-w-0 overflow-hidden rounded-b-3xl rounded-tr-3xl border border-slate-200 bg-white shadow-sm"
          id="product-panel"
          role="tabpanel"
        >
          <div className="border-b border-slate-200 px-5 pt-6 md:px-8">
            <p className="w-full text-sm leading-6 text-slate-600">
              {product.summary}
            </p>
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

          <ProductPages
            key={`${product.id}.${selectedSection}`}
            pages={
              product.sections.find(({ id }) => id === selectedSection)
                ?.pages ?? []
            }
            overview={
              coreSections.some(({ id }) => id === selectedSection) ||
              (selectedSection === "content" && Boolean(Content))
            }
          >
            {selectedSection === "website" && Website ? (
              <div>
                {document ? (
                  <header className="space-y-3 px-5 py-7 md:px-10">
                    <ConfirmationBadge confirmation={document.confirmation} />
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Website
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                      {documentPurpose("website").purpose}
                    </p>
                    <p className="text-sm leading-6 text-slate-500">
                      {documentPurpose("website").usage}
                    </p>
                  </header>
                ) : null}
                <div className="overflow-x-auto bg-black">
                  <Website />
                </div>
              </div>
            ) : selectedSection === "presentation" ? (
              <div>
                <div className="px-5 pt-6 md:px-8">
                  <ConfirmationBadge
                    confirmation={product.presentation.confirmation}
                  />
                </div>
                <PresentationPdfDownload
                  key={product.id}
                  fileName={`${product.id}-presentation.pdf`}
                  title={product.name}
                >
                  <div className="overflow-x-auto bg-black">
                    <Presentation content={product.presentation.content} />
                  </div>
                </PresentationPdfDownload>
                <div className="border-t border-slate-200 px-5 py-5 text-xs text-slate-500 md:px-8">
                  Source: {product.presentation.dataSourcePath}
                </div>
              </div>
            ) : selectedSection === "content" && Content ? (
              <div className="overflow-x-auto bg-black">
                <Content />
              </div>
            ) : document ? (
              <article className="px-5 py-7 md:px-10 md:py-10">
                <header className="mb-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <ConfirmationBadge confirmation={document.confirmation} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {document.label.replace(/^\d+ /, "")}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {documentPurpose(document.kind).purpose}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {documentPurpose(document.kind).usage}
                  </p>
                </header>
                <MarkdownDocument hideTitle>
                  {document.content}
                </MarkdownDocument>
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
          </ProductPages>
        </section>
      </div>
    </main>
  );
}

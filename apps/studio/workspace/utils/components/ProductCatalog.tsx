import { useEffect, useMemo, useRef, useState } from "react";
import { productStoryId } from "../products/catalog";

import type { IProductCatalogView, IProductView } from "../products/source";
import { MarkdownDocument } from "./ArtifactBrowser";
import { DocumentReviewToolbar } from "./DocumentStatus";
import { PresentationWorkspace } from "./PresentationWorkspace";
import { ProductPages } from "./ProductPages";
import { DocumentDownloads } from "./DocumentDownloads";

type ProductSection = string;
type ProductSurface = string;

const coreSections = [
  { id: "product", label: "Product" },
  { id: "model", label: "Operations & Economics" },
  { id: "sales", label: "Sales" },
  { id: "promotion", label: "Promotion" },
  { id: "analytics", label: "Analytics" },
];

const groupedSectionIds = new Set([
  "analytics",
  "content",
  "creative",
  "presentation",
  "promotion",
  "research",
  "website",
]);

function hasSurface(product: IProductView, id: string) {
  if (id === "presentation") return Boolean(product.presentation);
  if (id === "content" && product.content) return true;
  if (id === "website" && product.websiteComponent) return true;
  return (
    product.documents.some(({ kind }) => kind === id) ||
    product.sections.some((section) => section.id === id)
  );
}

function groupedSurfaces(product: IProductView, section: string) {
  const candidates =
    section === "product"
      ? [
          { id: "product", label: "Overview" },
          { id: "content", label: "Content" },
        ]
      : section === "promotion"
        ? [
            { id: "website", label: "Website" },
            { id: "creative", label: "Marketing Creative" },
            { id: "presentation", label: "Presentation" },
          ]
        : section === "analytics"
          ? [
              { id: "analytics", label: "Analytics" },
              { id: "research", label: "Research" },
            ]
          : [];
  return candidates.filter(({ id }) => hasSurface(product, id));
}

function sections(product: IProductView) {
  const builtIn = coreSections.filter(({ id }) => {
    if (id === "promotion" || id === "analytics")
      return groupedSurfaces(product, id).length > 0;
    return hasSurface(product, id);
  });
  return [
    ...builtIn,
    ...product.sections
      .filter(
        (section) =>
          !builtIn.some(({ id }) => id === section.id) &&
          !groupedSectionIds.has(section.id) &&
          section.id !== "content" &&
          section.id !== "sales",
      )
      .map((section) => ({
        id: section.id,
        label: section.id === "content" ? "Content" : section.title,
      })),
  ].map((section, index) => ({
    ...section,
    label: `${String(index + 1).padStart(2, "0")} ${section.label}`,
  }));
}

function requestedSelection(view: IProductCatalogView) {
  const params = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const product =
    view.products.find(({ id }) => id === params.get("product")) ??
    view.products[0];
  const requestedSection = params.get("section") ?? "product";
  const legacyGroups: Record<string, string> = {
    website: "promotion",
    creative: "promotion",
    presentation: "promotion",
    research: "analytics",
    content: "product",
  };
  const section = legacyGroups[requestedSection] ?? requestedSection;
  const availableSurfaces = product ? groupedSurfaces(product, section) : [];
  const requestedSurface =
    params.get("surface") ??
    (legacyGroups[requestedSection] ? requestedSection : section);
  return {
    product: product?.id ?? "",
    section:
      product && sections(product).some(({ id }) => id === section)
        ? section
        : "product",
    surface:
      availableSurfaces.find(({ id }) => id === requestedSurface)?.id ??
      availableSurfaces[0]?.id ??
      "",
  };
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

export interface IProductCatalogProps {
  view: IProductCatalogView;
  productId?: string;
}

export function ProductCatalog({
  view: catalogView,
  productId,
}: IProductCatalogProps) {
  const view = useMemo(
    () =>
      productId
        ? {
            ...catalogView,
            products: catalogView.products.filter(({ id }) => id === productId),
          }
        : catalogView,
    [catalogView, productId],
  );
  const directPresentation = requestedPresentation(view);
  const [selectedProductId, setSelectedProductId] = useState(
    requestedSelection(view).product,
  );
  const [selectedSection, setSelectedSection] = useState<ProductSection>(
    requestedSelection(view).section,
  );
  const [selectedSurface, setSelectedSurface] = useState<ProductSurface>(
    requestedSelection(view).surface,
  );
  const documentExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedProductId(requestedSelection(view).product);
    setSelectedSection(requestedSelection(view).section);
    setSelectedSurface(requestedSelection(view).surface);
  }, [view]);

  if (directPresentation) {
    if (!directPresentation.presentation)
      throw new Error(
        `Presentation for ${directPresentation.name} has not been prepared`,
      );
    const { Component, content } = directPresentation.presentation;
    return <Component content={content} />;
  }

  if (!view.products.length) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950 md:p-10">
        <section className="w-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            40 Products · {view.label}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {productId
              ? "Product absent from this catalog"
              : `No ${view.id} products`}
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
            {productId
              ? "This product is not defined in the selected source. Choose another product or source in the sidebar."
              : "This is the expected initial state."}{" "}
            The default view inherits the complete singlepage catalog until
            startup defines its first product. After that, startup replaces the
            entire catalog instead of mixing niches.
          </p>
          <code className="mt-6 inline-block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
            {view.sourcePaths[view.sourcePaths.length - 1]}
          </code>
        </section>
      </main>
    );
  }

  const product =
    view.products.find(({ id }) => id === selectedProductId) ??
    view.products[0];
  const surfaceOptions = groupedSurfaces(product, selectedSection);
  const activeSection =
    surfaceOptions.find(({ id }) => id === selectedSurface)?.id ??
    surfaceOptions[0]?.id ??
    selectedSection;
  const document = product.documents.find(({ kind }) => kind === activeSection);
  const Presentation = product.presentation?.Component;
  const Content = product.content?.Component;
  const Website = product.websiteComponent?.Component;

  const resolveDocumentLink = (href: string) => {
    if (typeof window === "undefined") return href;
    const shared = href.match(
      /^\/(brief|strategy|brand|design)\/(singlepage|startup)\.md(#.*)?$/,
    );
    if (shared) {
      const stories = {
        brief: "workspace-00-business-01-brief",
        strategy: "workspace-10-strategy-01-strategy",
        brand: "workspace-20-brand-01-brand",
        design: "workspace-30-design",
      };
      const url = new URL(window.location.href);
      url.pathname = url.pathname.replace(/iframe\.html$/, "");
      url.search = "";
      url.searchParams.set(
        "path",
        `/story/${stories[shared[1] as keyof typeof stories]}--${shared[2]}`,
      );
      url.hash = shared[3] ?? "";
      return {
        href: url.pathname + url.search + url.hash,
        target: "_top" as const,
      };
    }
    if (!href.startsWith("/workspace-products/")) return href;
    const target = new URL(href, window.location.href);
    const sourcePath = `apps/studio/workspace/products/${decodeURIComponent(target.pathname.slice("/workspace-products/".length))}`;
    // Prefer the current product when several products point at the same model.
    for (const candidate of [
      product,
      ...catalogView.products.filter(({ id }) => id !== product.id),
    ]) {
      const linked = candidate.documents.find(
        (document) => document.sourcePath === sourcePath,
      );
      if (!linked) continue;
      const url = new URL(window.location.href);
      if (productId) {
        const layer =
          view.id === "default"
            ? view.inherited
              ? "singlepage"
              : "startup"
            : view.id;
        const storyId = productStoryId(layer, candidate.id);
        url.pathname = url.pathname.replace(/iframe\.html$/, "");
        url.searchParams.delete("id");
        url.searchParams.delete("viewMode");
        url.searchParams.set("path", `/story/${storyId}`);
      }
      url.searchParams.set("product", candidate.id);
      if (["website", "creative", "presentation"].includes(linked.kind)) {
        url.searchParams.set("section", "promotion");
        url.searchParams.set("surface", linked.kind);
      } else if (["analytics", "research"].includes(linked.kind)) {
        url.searchParams.set("section", "analytics");
        url.searchParams.set("surface", linked.kind);
      } else {
        url.searchParams.set("section", linked.kind);
        url.searchParams.delete("surface");
      }
      url.hash = target.hash;
      const href = url.pathname + url.search + url.hash;
      return productId ? { href, target: "_top" as const } : href;
    }
    return href;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10">
      <header className="mb-8 w-full rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
        <h1
          id="product-title"
          className="text-3xl font-semibold tracking-tight md:text-5xl"
        >
          {productId ? product.name : "Products"}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
          {productId
            ? product.summary
            : "Connects each product's offer, operating model, customer process, promotion, observed results, and research in one reviewable workspace."}
        </p>
      </header>

      <div className="w-full min-w-0">
        {!productId && (
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
                  setSelectedSurface("");
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
        )}
        <section
          aria-labelledby={
            productId ? "product-title" : `product-tab-${product.id}`
          }
          className="min-w-0 overflow-hidden rounded-b-3xl rounded-tr-3xl border border-slate-200 bg-white shadow-sm"
          id="product-panel"
          role={productId ? undefined : "tabpanel"}
        >
          <div className="border-b border-slate-200 px-5 pt-6 md:px-8">
            {!productId && (
              <p className="w-full text-sm leading-6 text-slate-600">
                {product.summary}
              </p>
            )}
            {!product.model && (
              <p className="mt-3 text-sm text-amber-800">
                This legacy catalog needs model attribution. Existing materials
                remain available.
              </p>
            )}
            <nav
              className="mt-5 flex gap-1 overflow-x-auto"
              aria-label="Product documents"
            >
              {sections(product).map((section) => (
                <button
                  className={`whitespace-nowrap rounded-t-lg border-b-2 px-3 py-3 text-sm font-semibold transition ${
                    selectedSection === section.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section.id);
                    const options = groupedSurfaces(product, section.id);
                    if (!options.some(({ id }) => id === selectedSurface))
                      setSelectedSurface(options[0]?.id ?? "");
                  }}
                  type="button"
                >
                  {section.label}
                </button>
              ))}
            </nav>
            {surfaceOptions.length > 0 ? (
              <div className="-mx-5 border-t border-slate-900 bg-slate-950 px-5 py-4 md:-mx-8 md:px-8">
                <div
                  aria-label={
                    selectedSection === "product"
                      ? "Product views"
                      : selectedSection === "promotion"
                        ? "Promotion materials"
                        : "Analytics views"
                  }
                  className="flex flex-wrap gap-2"
                  role="tablist"
                >
                  {surfaceOptions.map((surface) => (
                    <button
                      aria-selected={activeSection === surface.id}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        activeSection === surface.id
                          ? "border-white bg-white text-slate-950 shadow-sm"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                      }`}
                      key={surface.id}
                      onClick={() => setSelectedSurface(surface.id)}
                      role="tab"
                      type="button"
                    >
                      {surface.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <ProductPages
            key={`${product.id}.${selectedSection}.${activeSection}`}
            downloadContext={product.name}
            resolveLink={resolveDocumentLink}
            pages={
              product.sections.find(({ id }) => id === activeSection)?.pages ??
              []
            }
            overview={
              Boolean(document) ||
              (activeSection === "presentation" && Boolean(Presentation)) ||
              (activeSection === "website" && Boolean(Website)) ||
              (activeSection === "content" && Boolean(Content))
            }
          >
            {activeSection === "website" && Website ? (
              <div>
                {document ? (
                  <DocumentReviewToolbar
                    confirmation={document.confirmation}
                    actions={
                      <DocumentDownloads
                        fileName={`${product.name}-website`}
                        htmlTargetRef={documentExportRef}
                        markdown={document.content}
                        markdownTitle="Website"
                        title={`${product.name} — Website`}
                      />
                    }
                  />
                ) : null}
                <div ref={documentExportRef} data-export-document>
                  <h2 className="px-5 pt-7 text-2xl font-semibold tracking-tight md:px-10">
                    Website
                  </h2>
                  <div className="mt-6 overflow-x-auto bg-black">
                    <Website />
                  </div>
                </div>
              </div>
            ) : activeSection === "presentation" &&
              Presentation &&
              product.presentation ? (
              <PresentationWorkspace
                key={product.id}
                name={product.name}
                fileName={`${product.id}-presentation`}
                content={product.presentation.content}
                confirmation={product.presentation.confirmation}
                dataSourcePath={product.presentation.dataSourcePath}
              >
                <Presentation content={product.presentation.content} />
              </PresentationWorkspace>
            ) : activeSection === "content" && Content ? (
              <div className="overflow-x-auto bg-black">
                <Content />
              </div>
            ) : document ? (
              <div>
                <DocumentReviewToolbar
                  confirmation={document.confirmation}
                  actions={
                    <DocumentDownloads
                      fileName={`${product.name}-${document.label.replace(/^\d+ /, "")}`}
                      htmlTargetRef={documentExportRef}
                      markdown={document.content}
                      markdownTitle={document.label.replace(/^\d+ /, "")}
                      title={`${product.name} — ${document.label.replace(/^\d+ /, "")}`}
                    />
                  }
                />
                <div ref={documentExportRef} data-export-document>
                  <article className="px-5 py-7 md:px-10 md:py-10">
                    <header className="mb-6">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {document.label.replace(/^\d+ /, "")}
                      </h2>
                      {document.kind === "model" && product.model && (
                        <p className="mt-3 text-sm text-slate-600">
                          {product.model.name} · Shared by:{" "}
                          {product.model.products.join(", ")}
                        </p>
                      )}
                    </header>
                    <MarkdownDocument
                      hideTitle
                      baseUrl={
                        "/workspace-products/" +
                        document.sourcePath.split("/products/")[1]
                      }
                      resolveLink={resolveDocumentLink}
                    >
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
                </div>
              </div>
            ) : null}
          </ProductPages>
        </section>
      </div>
    </main>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { productStoryId } from "../products/catalog";

import type { IProductCatalogView, IProductView } from "../products/source";
import { MarkdownDocument } from "./ArtifactBrowser";
import { DocumentHeader, DocumentReviewToolbar } from "./DocumentStatus";
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
      <main
        data-workspace-projection="default"
        className="grid min-h-screen font-[family-name:var(--workspace-brand-font-body)] place-items-center bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] md:p-10"
      >
        <section className="w-full rounded-3xl border border-dashed border-[var(--workspace-brand-line)] bg-white p-8 text-center  md:p-12">
          <p className="text-xs font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
            40 Products · {view.label}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {productId
              ? "Product absent from this catalog"
              : `No ${view.id} products`}
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--workspace-brand-muted)]">
            {productId
              ? "This product is not defined in the selected source. Choose another product or source in the sidebar."
              : "This is the expected initial state."}{" "}
            The default view inherits the complete singlepage catalog until
            startup defines its first product. After that, startup replaces the
            entire catalog instead of mixing niches.
          </p>
          <code className="mt-6 inline-block rounded-lg bg-[var(--workspace-brand-background)] px-3 py-2 text-xs text-[var(--workspace-brand-muted)]">
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
    <main
      data-workspace-projection="default"
      className="min-h-screen font-[family-name:var(--workspace-brand-font-body)] bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] md:p-10"
    >
      <DocumentHeader
        titleId="product-title"
        title={productId ? product.name : "Products"}
        purpose={
          productId
            ? product.summary
            : "Connects each product's offer, operating model, customer process, promotion, observed results, and research in one reviewable workspace."
        }
      />

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
                className={`shrink-0 whitespace-nowrap rounded-t-xl border px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--workspace-brand-focus)] ${
                  candidate.id === product.id
                    ? "border-[var(--workspace-brand-line)] border-b-white bg-white text-[var(--workspace-brand-foreground)]"
                    : "border-transparent bg-[var(--workspace-brand-line)]/60 text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-line)] hover:text-[var(--workspace-brand-foreground)]"
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
          className="min-w-0 overflow-hidden rounded-b-3xl rounded-tr-3xl border border-[var(--workspace-brand-line)] bg-white "
          id="product-panel"
          role={productId ? undefined : "tabpanel"}
        >
          <div className="border-b border-[var(--workspace-brand-line)] px-5 pt-6 md:px-8">
            {!productId && (
              <p className="w-full text-sm leading-6 text-[var(--workspace-brand-muted)]">
                {product.summary}
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
                      ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-primary)] text-white"
                      : "border-transparent text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)]"
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
              <div className="-mx-5 border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-primary)] px-5 py-4 md:-mx-8 md:px-8">
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
                          ? "border-white bg-white text-[var(--workspace-brand-foreground)] "
                          : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-primary)] text-[var(--workspace-brand-muted-on-primary)] hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-primary)] hover:text-white"
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
                      <h2 className="text-2xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)]">
                        {document.label.replace(/^\d+ /, "")}
                      </h2>
                      {document.kind === "model" && product.model && (
                        <p className="mt-3 text-sm text-[var(--workspace-brand-muted)]">
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
                    <div className="mt-8 border-t border-[var(--workspace-brand-line)] pt-4 text-xs text-[var(--workspace-brand-muted)]">
                      <span className="block font-semibold tracking-normal text-[var(--workspace-brand-foreground)]">
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

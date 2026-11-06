import { useRef } from "react";
import type { IProductCatalogView, IProductView } from "../products/source";
import {
  productPageSearchQueries,
  type IProductPageView,
} from "../products/pages";
import { flattenWorkspacePages } from "../pages";
import { materialNavigationTarget } from "../products/catalog";
import { parseDocument } from "../../../../../tools/studio/workspace/document";
import { ProductCatalog, resolveProductDocumentLink } from "./ProductCatalog";
import { DocumentHeader } from "./DocumentHeader";
import { DocumentDownloads } from "./DocumentDownloads";
import { WorkspacePage } from "./WorkspacePage";
import { PresentationWorkspace } from "./PresentationWorkspace";

export interface IProductMaterialsProps {
  view: IProductCatalogView;
  productId?: string;
  materialId?: string;
}

function documentPage(
  product: IProductView,
  kind: "website" | "creative",
): IProductPageView[] {
  const document = product.documents.find((item) => item.kind === kind);
  return document
    ? [
        {
          id: kind,
          title:
            kind === "website"
              ? "Задача страницы, воронка и SEO"
              : "Задача рекламы",
          kind: "markdown",
          markdown: document.content,
          sourcePath: document.sourcePath,
          url: `/workspace-products/${document.sourcePath.split("/products/")[1]}`,
          layer: document.sourcePath.includes("/startup/")
            ? "startup"
            : "singlepage",
          children: [],
        },
      ]
    : [];
}

function MaterialBlock({
  page,
  prefix,
  view,
  product,
  title,
  hideHeading = false,
}: {
  page: IProductPageView;
  prefix: string;
  view: IProductCatalogView;
  product: IProductView;
  title?: string;
  hideHeading?: boolean;
}) {
  const visual = page;
  const hasContent = visual.kind !== "group";
  return (
    <section
      id={`${prefix}-${page.id}`}
      className="min-w-0 scroll-mt-5 space-y-8"
      aria-label={title ?? page.title}
    >
      <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-white">
        {!hideHeading && (
          <h2 className="border-b border-[var(--workspace-brand-line)] px-6 py-6 text-2xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)] md:px-10 md:text-3xl">
            {title ?? page.title}
          </h2>
        )}
        {hasContent && (
          <WorkspacePage
            page={visual}
            hideTitle
            hideConfirmation
            resolveLink={(href) =>
              resolveProductDocumentLink(href, view, product)
            }
          />
        )}
      </div>
      {page.children.map((child) => (
        <MaterialBlock
          key={child.id}
          page={child}
          prefix={prefix}
          view={view}
          product={product}
        />
      ))}
    </section>
  );
}

/** One complete material per story; derivatives are sequential blocks, never navigation. */
export function ProductMaterials({
  view,
  productId,
  materialId,
}: IProductMaterialsProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const product = productId
    ? view.products.find(({ id }) => id === productId)
    : view.products[0];
  if (!product) return <ProductCatalog view={view} productId={productId} />;
  const pages = (section: string) =>
    product.sections.find(({ id }) => id === section)?.pages ?? [];
  const requested = materialId ?? "website";
  const selected = materialNavigationTarget(product, requested).story;
  const article = pages("articles").find(
    ({ id }) => `articles-${id}` === selected,
  );
  const presentation =
    selected === "presentation" ? product.presentation : undefined;
  const Presentation = presentation?.Component;
  const website = flattenWorkspacePages(pages("website")).find(
    ({ id }) => id === "landing",
  );
  let blocks: IProductPageView[] = [];
  let title: string | undefined;
  let prefix = selected.split("-")[0];
  if (article) {
    title = article.title;
    blocks = [
      { ...article, title: "Задание и цель", children: [] },
      ...article.children,
    ];
    prefix = "articles";
  } else if (selected === "website") {
    title = "Сайт";
    blocks = [
      ...documentPage(product, "website"),
      ...(website ? [{ ...website, title: "Посадочная страница" }] : []),
    ];
  } else if (selected === "creative") {
    title = "Рекламные материалы";
    blocks = [...documentPage(product, "creative"), ...pages("creative")];
  } else if (presentation) {
    title = "Презентация";
    blocks = pages("presentation");
  }
  if (!title)
    return (
      <ProductCatalog
        view={view}
        productId={product.id}
        materialId={requested}
      />
    );
  const metadata = article
    ? parseDocument(article.markdown ?? "").metadata
    : {};
  const searchQueries = article ? productPageSearchQueries(article) : [];
  const sourceBlocks = flattenWorkspacePages(blocks);
  const markdown = [
    ...sourceBlocks.flatMap((page) =>
      page.markdown ? [parseDocument(page.markdown).body] : [],
    ),
  ].join("\n\n");
  return (
    <main
      data-workspace-projection="default"
      className="min-h-screen w-full min-w-0 space-y-8 bg-[var(--workspace-brand-background)] p-5 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] md:p-10"
    >
      <DocumentHeader
        eyebrow={product.name}
        title={title}
        actions={
          <DocumentDownloads
            fileName={`${product.id}-${selected}`}
            htmlTargetRef={exportRef}
            markdown={markdown || undefined}
            markdownTitle={title}
            title={`${product.name} — ${title}`}
            theme="dark"
          />
        }
      />
      <div ref={exportRef} data-export-document className="min-w-0 space-y-8">
        {article && (
          <dl className="grid gap-5 rounded-3xl border border-[var(--workspace-brand-line)] bg-white px-6 py-6 md:px-10">
            {(
              [
                ["audience", "Аудитория"],
                ["goal", "Задача материала"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <dt className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                  {label}
                </dt>
                <dd className="mt-1">
                  {typeof metadata[key] === "string" && metadata[key]
                    ? metadata[key]
                    : "Не указано"}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Поисковые запросы
              </dt>
              <dd className="mt-1">
                {searchQueries.length ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {searchQueries.map((query) => (
                      <li key={query}>{query}</li>
                    ))}
                  </ul>
                ) : (
                  "Не указаны в SEO-задании"
                )}
              </dd>
            </div>
          </dl>
        )}
        <div className="space-y-8">
          {blocks.map((page) => (
            <MaterialBlock
              key={page.id}
              page={page}
              hideHeading={blocks.length === 1 && page.title === title}
              prefix={prefix}
              view={view}
              product={product}
            />
          ))}
          {Presentation && presentation && (
            <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-white">
              <PresentationWorkspace
                name={product.name}
                fileName={`${product.id}-presentation`}
                hideHeader
              >
                <Presentation />
              </PresentationWorkspace>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

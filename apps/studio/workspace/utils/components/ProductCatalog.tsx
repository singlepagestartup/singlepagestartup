import { useRef } from "react";
import type { IProductCatalogView, IProductView } from "../products/source";
import type { IProductPageView } from "../products/pages";
import {
  productStoryId,
  materialStoryId,
  materialNavigationTarget,
  type ProductCatalogLayer,
} from "../products/catalog";
import { parseDocument } from "../../../../../tools/studio/workspace/document";
import { MarkdownDocument } from "./ArtifactBrowser";
import { DocumentHeader } from "./DocumentHeader";
import { DocumentDownloads } from "./DocumentDownloads";
import { WorkspacePage } from "./WorkspacePage";
import { PresentationWorkspace } from "./PresentationWorkspace";

function materialPages(product: IProductView) {
  const flat = (pages: IProductPageView[]): IProductPageView[] =>
    pages.flatMap((page) => [page, ...flat(page.children)]);
  return product.sections
    .filter(({ id }) => ["website", "creative", "articles"].includes(id))
    .flatMap((section) =>
      flat(section.pages)
        .filter(({ kind }) => kind !== "group")
        .map((page) => ({ id: `${section.id}-${page.id}`, page })),
    );
}

export interface IProductCatalogProps {
  view: IProductCatalogView;
  productId?: string;
  documentId?: string;
  materialId?: string;
}

export function ProductCatalog({
  view,
  productId,
  documentId = "product",
  materialId,
}: IProductCatalogProps) {
  const product = productId
    ? view.products.find(({ id }) => id === productId)
    : view.products[0];
  if (!product)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">
          {productId ? "Продукт не найден" : "Продуктов пока нет"}
        </h1>
        <p className="mt-3">
          Добавьте описание продукта, чтобы подготовить его сайт и материалы.
        </p>
      </main>
    );
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("document") ===
      "presentation"
  ) {
    const Presentation = product.presentation?.Component;
    return Presentation ? (
      <Presentation />
    ) : (
      <main className="p-8">Нет презентации для {product.name}</main>
    );
  }
  return (
    <ProductDocument
      view={view}
      product={product}
      documentId={materialId ? undefined : documentId}
      materialId={materialId}
    />
  );
}

export interface IProductDocumentProps {
  view: IProductCatalogView;
  product: IProductView;
  documentId?: string;
  materialId?: string;
}

export function ProductDocument({
  view,
  product,
  documentId,
  materialId,
}: IProductDocumentProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const material = materialPages(product).find(
    ({ id }) => id === materialId,
  )?.page;
  const document = product.documents.find(
    ({ kind }) => kind === (documentId ?? materialId),
  );
  const presentation =
    materialId === "presentation" ? product.presentation : undefined;
  const Presentation = presentation?.Component;
  const markdown = material?.markdown ?? document?.content;
  const title =
    material?.title ??
    (presentation ? "Презентация" : document?.label.replace(/^\d+ /, ""));
  const sourcePath =
    material?.sourcePath ?? document?.sourcePath ?? presentation?.sourcePath;
  const selection = documentId ?? materialId ?? "product";
  const resolveLink = (href: string) =>
    resolveProductDocumentLink(href, view, product);
  if (!title)
    return (
      <main className="p-8">
        <h1>{product.name}</h1>
        <p className="mt-4">Документ не найден: {selection}</p>
      </main>
    );
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
            fileName={`${product.id}-${selection}`}
            htmlTargetRef={exportRef}
            htmlUrl={
              material?.kind === "html" && !material.html
                ? material.url
                : undefined
            }
            markdown={markdown}
            markdownTitle={title}
            title={`${product.name} — ${title}`}
            theme="dark"
          />
        }
      />
      <section
        ref={exportRef}
        data-export-document
        className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-white"
      >
        {Presentation ? (
          <PresentationWorkspace
            name={product.name}
            fileName={`${product.id}-presentation`}
            hideHeader
          >
            <Presentation />
          </PresentationWorkspace>
        ) : material ? (
          <WorkspacePage page={material} hideTitle resolveLink={resolveLink} />
        ) : markdown ? (
          <article className="px-6 py-7 md:px-10">
            <MarkdownDocument
              hideTitle
              baseUrl={
                sourcePath
                  ? `/workspace-products/${sourcePath.split("/products/")[1]}`
                  : undefined
              }
              resolveLink={resolveLink}
            >
              {markdown}
            </MarkdownDocument>
          </article>
        ) : null}
      </section>
    </main>
  );
}

export function resolveProductDocumentLink(
  href: string,
  view: IProductCatalogView,
  product: IProductView,
): string | { href: string; target: "_top" } {
  if (typeof window === "undefined") return href;
  const target = new URL(href, window.location.href);
  if (
    target.origin === window.location.origin &&
    target.searchParams.get("path")?.startsWith("/story/")
  )
    return {
      href: target.pathname + target.search + target.hash,
      target: "_top",
    };
  let story: string | undefined;
  let anchor: string | undefined;
  const shared = target.pathname.match(
    /^\/(?:workspace-)?(brief|strategy|brand|design)\/(singlepage|startup)\.md$/,
  );
  if (shared) {
    story = `workspace-${shared[1]}-${shared[2]}--document`;
  }
  if (target.pathname.startsWith("/workspace-products/")) {
    const path = `apps/studio/workspace/products/${decodeURIComponent(target.pathname.slice("/workspace-products/".length))}`;
    const layer = target.pathname.split("/")[2] as ProductCatalogLayer;
    for (const candidate of [
      product,
      ...view.products.filter(({ id }) => id !== product.id),
    ]) {
      const linked = candidate.documents.find(
        (item) => item.sourcePath === path,
      );
      if (linked) {
        if (["website", "creative"].includes(linked.kind)) {
          const target = materialNavigationTarget(candidate, linked.kind);
          story = materialStoryId(
            layer,
            candidate.id,
            target.story,
            target.group,
          );
        } else story = productStoryId(layer, candidate.id, linked.kind);
        break;
      }
      const linkedPage = materialPages(candidate).find(({ page }) =>
        [page.sourcePath].includes(path),
      );
      if (linkedPage) {
        const target = materialNavigationTarget(candidate, linkedPage.id);
        story = materialStoryId(
          layer,
          candidate.id,
          target.story,
          target.group,
        );
        anchor = target.anchor;
        break;
      }
    }
  }
  if (!story) {
    if (
      target.origin === window.location.origin &&
      target.pathname.startsWith("/workspace-products/") &&
      /\.(?:md|ya?ml|csv|[jt]sx?)$/i.test(target.pathname)
    )
      throw new Error(
        `Ссылка ведёт на незарегистрированный исходник: ${target.pathname}. Используйте видимую страницу Studio.`,
      );
    return href;
  }
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/iframe\.html$/, "");
  url.search = "";
  url.searchParams.set("path", `/story/${story}`);
  url.hash = target.hash || (anchor ? `#${anchor}` : "");
  return { href: url.pathname + url.search + url.hash, target: "_top" };
}

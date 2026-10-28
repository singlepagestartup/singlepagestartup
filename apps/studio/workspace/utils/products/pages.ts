import {
  productStoryId,
  type IProductSection,
  type ProductCatalogLayer,
} from "./catalog";
import type { IProductCatalogView } from "./source";
import {
  resolveWorkspacePage,
  findWorkspacePage,
  type IWorkspacePageSources,
  type IWorkspacePageView,
} from "../pages";

export type IProductPageView = IWorkspacePageView;
export type IProductPageSources = IWorkspacePageSources;

export interface IProductSectionView {
  id: string;
  title: string;
  pages: IProductPageView[];
}

/** Resolve only explicitly declared pages from the selected product layer. */
export function resolveProductSections(
  sections: IProductSection[],
  layer: ProductCatalogLayer,
  sources: IProductPageSources,
): IProductSectionView[] {
  return sections.map((section) => ({
    ...section,
    pages: section.pages.map((page) =>
      resolveWorkspacePage(page, layer, sources, "products"),
    ),
  }));
}

export interface IProductPreviewLinkOptions {
  catalog: IProductCatalogView;
  currentProductId: string;
  currentSection: string;
  locationHref: string;
}

/** Route product prototypes through their declared catalog, without runtime imports. */
export function resolveProductPreviewLink(
  href: string,
  {
    catalog,
    currentProductId,
    currentSection,
    locationHref,
  }: IProductPreviewLinkOptions,
): string | { href: string; target: "_top" } {
  if (!href.startsWith("/") || href.startsWith("/workspace-products/"))
    return href;
  let destination: URL;
  try {
    destination = new URL(href, locationHref);
    if (destination.origin !== new URL(locationHref).origin) return href;
  } catch {
    return href;
  }
  const candidates = [
    ...catalog.products.filter(({ id }) => id === currentProductId),
    ...catalog.products.filter(({ id }) => id !== currentProductId),
  ].flatMap((product) =>
    product.sections.flatMap((section) => {
      const page = findWorkspacePage(section.pages, href, locationHref);
      return page ? [{ product, section, page }] : [];
    }),
  );
  const linked =
    candidates.find(({ page }) => page.route === destination.pathname) ??
    candidates[0];
  if (!linked) return href;
  if (
    linked.product.id === currentProductId &&
    linked.section.id === currentSection
  )
    return href;
  const layer =
    catalog.id === "default"
      ? catalog.inherited
        ? "singlepage"
        : "startup"
      : catalog.id;
  const url = new URL(locationHref);
  url.pathname = url.pathname.replace(/iframe\.html$/, "");
  url.search = "";
  url.hash = "";
  url.searchParams.set(
    "path",
    `/story/${productStoryId(layer, linked.product.id)}`,
  );
  url.searchParams.set("product", linked.product.id);
  if (["website", "creative", "presentation"].includes(linked.section.id)) {
    url.searchParams.set("section", "promotion");
    url.searchParams.set("surface", linked.section.id);
  } else if (["analytics", "research"].includes(linked.section.id)) {
    url.searchParams.set("section", "analytics");
    url.searchParams.set("surface", linked.section.id);
  } else {
    url.searchParams.set("section", linked.section.id);
  }
  url.searchParams.set("page", linked.page.id);
  url.searchParams.set(
    "representation",
    linked.page.representations?.preview ? "preview" : "text",
  );
  url.searchParams.set(
    "navigationHref",
    destination.pathname + destination.search + destination.hash,
  );
  return { href: url.pathname + url.search, target: "_top" };
}

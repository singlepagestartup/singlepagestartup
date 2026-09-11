import type { IProductSection, ProductCatalogLayer } from "./catalog";
import {
  resolveWorkspacePage,
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

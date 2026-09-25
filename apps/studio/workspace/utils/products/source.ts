import {
  documentConfirmation,
  type IDocumentConfirmation,
} from "../../../../../tools/studio/workspace/document";
import type { ComponentType } from "react";

import { workspaceReviews } from "../review-source";
import {
  parseProductCatalog,
  resolveProductCatalog,
  type IProductCatalog,
  type ProductCatalogLayer,
} from "./catalog";
import singlepageCatalogSource from "../../products/singlepage/catalog.yaml?raw";
import startupCatalogSource from "../../products/startup/catalog.yaml?raw";
import {
  parseSalesProcess,
  salesOverviewMarkdown,
  validateSalesSegments,
} from "./sales";
import { parseDocument } from "../../../../../tools/studio/workspace/document";
import { salesSegmentPages } from "../components/SalesSegment";
import { splitProductDocument } from "./economics";
import { parseProductPresentation } from "./presentation-data";
import {
  resolveProductSections,
  type IProductSectionView,
  type IProductPageView,
} from "./pages";

const documentSources = import.meta.glob<string>(
  [
    "../../products/{singlepage,startup}/**/*.md",
    "../../products/{singlepage,startup}/**/*.yaml",
  ],
  { eager: true, import: "default", query: "?raw" },
);

interface IPresentationModule {
  default?: ComponentType<{ content: Record<string, unknown> }>;
}

interface IProductSurfaceModule {
  default?: ComponentType;
}

const componentModules = import.meta.glob<IProductSurfaceModule>(
  "../../products/{singlepage,startup}/**/*.{tsx,jsx}",
  { eager: true },
);
const presentationModules = componentModules as Record<
  string,
  IPresentationModule
>;
const websiteModules = componentModules;
const contentModules = componentModules;
const fileModules = import.meta.glob(
  "../../products/{singlepage,startup}/**/*",
  { query: "?url", import: "default" },
);
const sourceKey = (key: string) => key.slice("../../products/".length);
const pageSources = {
  components: Object.fromEntries(
    Object.entries(componentModules).map(([key, value]) => [
      sourceKey(key),
      value,
    ]),
  ),
  markdown: Object.fromEntries(
    Object.entries(documentSources).map(([key, value]) => [
      sourceKey(key),
      value,
    ]),
  ),
  files: new Set(Object.keys(fileModules).map(sourceKey)),
};

export interface IProductDocument {
  confirmation: IDocumentConfirmation;
  content: string;
  kind:
    | "analytics"
    | "creative"
    | "product"
    | "research"
    | "sales"
    | "website"
    | "model";
  label: string;
  sourcePath: string;
}

export interface IProductView {
  model?: { id: string; name: string; products: string[] };
  sections: IProductSectionView[];
  content?: IProductSurface;
  documents: IProductDocument[];
  id: string;
  name: string;
  presentation?: {
    Component: ComponentType<{ content: Record<string, unknown> }>;
    content: Record<string, unknown>;
    confirmation: IDocumentConfirmation;
    dataSourcePath: string;
    sourcePath: string;
  };
  summary: string;
  websiteComponent?: IProductSurface;
}

interface IProductSurface {
  Component: ComponentType;
  sourcePath: string;
}

export interface IProductCatalogView {
  id: "default" | ProductCatalogLayer;
  inherited: boolean;
  label: string;
  products: IProductView[];
  sourcePaths: string[];
}

function moduleKey(layer: ProductCatalogLayer, relativePath: string): string {
  return `../../products/${layer}/${relativePath}`;
}

function documentSource(
  layer: ProductCatalogLayer,
  relativePath: string,
): string {
  const source = documentSources[`../../products/${layer}/${relativePath}`];
  if (typeof source !== "string") {
    throw new Error(
      `Missing product document: products/${layer}/${relativePath}`,
    );
  }
  return source;
}

function productSurface(
  modules: Record<string, IProductSurfaceModule>,
  layer: ProductCatalogLayer,
  relativePath: string | undefined,
  surface: string,
): IProductSurface | undefined {
  if (!relativePath) return undefined;
  const Component = modules[moduleKey(layer, relativePath)]?.default;
  if (!Component) {
    throw new Error(
      `Missing product ${surface}: products/${layer}/${relativePath}`,
    );
  }
  return {
    Component,
    sourcePath: `apps/studio/workspace/products/${layer}/${relativePath}`,
  };
}

function view(
  id: IProductCatalogView["id"],
  catalog: IProductCatalog,
  inherited: boolean,
): IProductCatalogView {
  const products = catalog.products.map((entry) => {
    const presentationContent = entry.presentation_data
      ? parseProductPresentation<Record<string, unknown>>(
          documentSource(catalog.layer, entry.presentation_data),
          entry.id,
        )
      : {};
    const confirmation = (
      kind: IProductDocument["kind"] | "presentation",
      relativePath: string,
    ) =>
      workspaceReviews[id === "singlepage" ? "singlepage" : "default"].get(
        `product.${entry.id}.${kind}`,
      )?.confirmation ??
      documentConfirmation(
        documentSource(catalog.layer, relativePath),
        catalog.layer,
        relativePath.endsWith(".yaml") ? "yaml" : "markdown",
      );
    const presentationPath = entry.presentation
      ? moduleKey(catalog.layer, entry.presentation)
      : "";
    const Component = presentationModules[presentationPath]?.default;
    if (entry.presentation && !Component) {
      throw new Error(
        `Missing product presentation: products/${catalog.layer}/${entry.presentation}`,
      );
    }
    const model = catalog.models.find(({ id }) => id === entry.model);
    const productHalves = splitProductDocument(
      documentSource(catalog.layer, entry.product),
    );
    const sections = resolveProductSections(
      entry.sections,
      catalog.layer,
      pageSources,
    );
    for (const section of sections) {
      const attach = (pages: IProductPageView[]) =>
        pages.forEach((page) => {
          page.confirmation = workspaceReviews[
            id === "singlepage" ? "singlepage" : "default"
          ].get(
            `product.${entry.id}.page.${section.id}.${page.id}`,
          )?.confirmation;
          if (page.representations)
            page.representations.text.confirmation = page.confirmation;
          attach(page.children);
        });
      attach(section.pages);
    }
    const sales = parseSalesProcess(
      documentSource(catalog.layer, entry.sales),
      entry.id,
    );
    validateSalesSegments(
      sales,
      parseDocument(documentSource(catalog.layer, entry.product)).metadata
        .customer_segments,
    );
    const segmentPages = salesSegmentPages(
      sales,
      catalog.layer,
      `apps/studio/workspace/products/${catalog.layer}/${entry.sales}`,
      confirmation("sales", entry.sales),
    );
    if (segmentPages.length) {
      const extension = sections.find((section) => section.id === "sales");
      if (extension) extension.pages = [...segmentPages, ...extension.pages];
      else sections.push({ id: "sales", title: "Sales", pages: segmentPages });
    }
    return {
      model: model
        ? {
            id: model.id,
            name: model.name,
            products: catalog.products
              .filter((product) => product.model === model.id)
              .map(({ name }) => name),
          }
        : undefined,
      sections,
      content: productSurface(
        contentModules,
        catalog.layer,
        entry.content,
        "content",
      ),
      documents: [
        {
          content: productHalves.offer,
          kind: "product" as const,
          confirmation: confirmation("product", entry.product),
          label: "01 Product" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.product}`,
        },
        ...(productHalves.economics
          ? [
              {
                content: productHalves.economics,
                kind: "model" as const,
                label: "02 Operations & Economics",
                confirmation: confirmation("product", entry.product),
                sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.product}`,
              },
            ]
          : []),
        {
          content: documentSource(catalog.layer, entry.research),
          kind: "research" as const,
          confirmation: confirmation("research", entry.research),
          label: "02 Research" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.research}`,
        },
        {
          content: salesOverviewMarkdown(sales),
          kind: "sales" as const,
          confirmation: confirmation("sales", entry.sales),
          label: "03 Sales" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.sales}`,
        },
        ...(entry.analytics
          ? [
              {
                content: documentSource(catalog.layer, entry.analytics),
                kind: "analytics" as const,
                confirmation: confirmation("analytics", entry.analytics),
                label: "06 Analytics" as const,
                sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.analytics}`,
              },
            ]
          : []),
        ...(entry.website
          ? [
              {
                content: documentSource(catalog.layer, entry.website),
                kind: "website" as const,
                confirmation: confirmation("website", entry.website),
                label: "04 Website" as const,
                sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.website}`,
              },
            ]
          : []),
        ...(entry.marketing_creative
          ? [
              {
                content: documentSource(
                  catalog.layer,
                  entry.marketing_creative,
                ),
                kind: "creative" as const,
                confirmation: confirmation(
                  "creative",
                  entry.marketing_creative,
                ),
                label: "05 Marketing Creative" as const,
                sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.marketing_creative}`,
              },
            ]
          : []),
      ],
      id: entry.id,
      name: entry.name,
      presentation:
        Component && entry.presentation && entry.presentation_data
          ? {
              Component,
              content: presentationContent,
              confirmation: confirmation(
                "presentation",
                entry.presentation_data,
              ),
              dataSourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.presentation_data}`,
              sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.presentation}`,
            }
          : undefined,
      summary: entry.summary,
      websiteComponent: productSurface(
        websiteModules,
        catalog.layer,
        entry.website_component,
        "website component",
      ),
    };
  });
  return {
    id,
    inherited,
    label:
      id === "default"
        ? inherited
          ? "default · inherited singlepage catalog"
          : "default · startup catalog"
        : `${id} source`,
    products,
    sourcePaths: [
      "apps/studio/workspace/products/singlepage/catalog.yaml",
      ...(id === "singlepage"
        ? []
        : ["apps/studio/workspace/products/startup/catalog.yaml"]),
    ],
  };
}

const singlepageCatalog = parseProductCatalog(
  singlepageCatalogSource,
  "singlepage",
);
const startupCatalog = parseProductCatalog(startupCatalogSource, "startup");
const resolved = resolveProductCatalog(singlepageCatalog, startupCatalog);

export const productCatalogViews = {
  default: view("default", resolved.catalog, resolved.inherited),
  singlepage: view("singlepage", singlepageCatalog, false),
  startup: view("startup", startupCatalog, false),
};

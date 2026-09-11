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
import { parseSalesProcess, salesProcessMarkdown } from "./sales";
import { parseProductPresentation } from "./presentation-data";
import { resolveProductSections, type IProductSectionView } from "./pages";

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
  kind: "creative" | "product" | "research" | "sales" | "website";
  label:
    | "01 Product Overview"
    | "02 Research"
    | "03 Sales"
    | "04 Website"
    | "05 Marketing Creative";
  sourcePath: string;
}

export interface IProductView {
  sections: IProductSectionView[];
  content?: IProductSurface;
  documents: IProductDocument[];
  id: string;
  name: string;
  presentation: {
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
    const presentationContent = parseProductPresentation<
      Record<string, unknown>
    >(documentSource(catalog.layer, entry.presentation_data), entry.id);
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
    const presentationPath = moduleKey(catalog.layer, entry.presentation);
    const Component = presentationModules[presentationPath]?.default;
    if (!Component) {
      throw new Error(
        `Missing product presentation: products/${catalog.layer}/${entry.presentation}`,
      );
    }
    return {
      sections: resolveProductSections(
        entry.sections,
        catalog.layer,
        pageSources,
      ),
      content: productSurface(
        contentModules,
        catalog.layer,
        entry.content,
        "content",
      ),
      documents: [
        {
          content: documentSource(catalog.layer, entry.product),
          kind: "product" as const,
          confirmation: confirmation("product", entry.product),
          label: "01 Product Overview" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.product}`,
        },
        {
          content: documentSource(catalog.layer, entry.research),
          kind: "research" as const,
          confirmation: confirmation("research", entry.research),
          label: "02 Research" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.research}`,
        },
        {
          content: salesProcessMarkdown(
            parseSalesProcess(
              documentSource(catalog.layer, entry.sales),
              entry.id,
            ),
          ),
          kind: "sales" as const,
          confirmation: confirmation("sales", entry.sales),
          label: "03 Sales" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.sales}`,
        },
        {
          content: documentSource(catalog.layer, entry.website),
          kind: "website" as const,
          confirmation: confirmation("website", entry.website),
          label: "04 Website" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.website}`,
        },
        {
          content: documentSource(catalog.layer, entry.marketing_creative),
          kind: "creative" as const,
          confirmation: confirmation("creative", entry.marketing_creative),
          label: "05 Marketing Creative" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.marketing_creative}`,
        },
      ],
      id: entry.id,
      name: entry.name,
      presentation: {
        Component,
        content: presentationContent,
        confirmation: confirmation("presentation", entry.presentation_data),
        dataSourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.presentation_data}`,
        sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.presentation}`,
      },
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

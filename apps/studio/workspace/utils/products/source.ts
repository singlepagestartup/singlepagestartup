import type { ComponentType } from "react";

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
  salesProcessMarkdown,
  validateSalesSegments,
} from "./sales";
import { parseDocument } from "../../../../../tools/studio/workspace/document";
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
  default?: ComponentType;
}

interface IProductSurfaceModule {
  default?: ComponentType;
}

const componentModules = import.meta.glob<IProductSurfaceModule>(
  [
    "../../products/{singlepage,startup}/**/*.{tsx,jsx}",
    "!../../products/**/*.{test,spec,stories}.{tsx,jsx}",
    "!../../products/**/__tests__/**",
  ],
  { eager: true },
);
const presentationModules = componentModules as Record<
  string,
  IPresentationModule
>;
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
  content: string;
  kind:
    | "audience"
    | "competitors"
    | "semantics"
    | "economics"
    | "creative"
    | "product"
    | "sales"
    | "website";
  label: string;
  sourcePath: string;
}

export interface IProductView {
  sections: IProductSectionView[];
  documents: IProductDocument[];
  id: string;
  name: string;
  presentation?: {
    Component: ComponentType;
    sourcePath: string;
  };
  summary: string;
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

function view(
  id: IProductCatalogView["id"],
  catalog: IProductCatalog,
  inherited: boolean,
): IProductCatalogView {
  const products = catalog.products.map((entry) => {
    const presentationPath = entry.presentation
      ? moduleKey(catalog.layer, entry.presentation)
      : "";
    const Component = presentationModules[presentationPath]?.default;
    if (entry.presentation && !Component) {
      throw new Error(
        `Missing product presentation: products/${catalog.layer}/${entry.presentation}`,
      );
    }
    const sections = resolveProductSections(
      entry.sections,
      catalog.layer,
      pageSources,
    );
    const sales = parseSalesProcess(
      documentSource(catalog.layer, entry.sales),
      entry.id,
    );
    validateSalesSegments(
      sales,
      parseDocument(documentSource(catalog.layer, entry.product)).metadata
        .customer_segments,
    );
    return {
      sections,
      documents: [
        ...(
          [
            ["audience", "Аудитория"],
            ["competitors", "Конкуренты"],
            ["semantics", "Семантика"],
            ["economics", "Экономика"],
          ] as const
        ).map(([kind, label]) => ({
          kind,
          label,
          content: documentSource(catalog.layer, entry[kind]),
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry[kind]}`,
        })),
        {
          content: documentSource(catalog.layer, entry.product),
          kind: "product" as const,

          label: "01 Описание" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.product}`,
        },
        {
          content: salesProcessMarkdown(sales),
          kind: "sales" as const,

          label: "03 Продажи" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.sales}`,
        },
        ...(entry.website
          ? [
              {
                content: documentSource(catalog.layer, entry.website),
                kind: "website" as const,

                label: "Задача и структура сайта" as const,
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
                label: "Задание на рекламу" as const,
                sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.marketing_creative}`,
              },
            ]
          : []),
      ],
      id: entry.id,
      name: entry.name,
      presentation:
        Component && entry.presentation
          ? {
              Component,
              sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.presentation}`,
            }
          : undefined,
      summary: entry.summary,
    };
  });
  return {
    id,
    inherited,
    label:
      id === "default"
        ? inherited
          ? "default · каталог из singlepage"
          : "default · каталог startup"
        : `Источник: ${id}`,
    products,
    sourcePaths:
      id === "default"
        ? [
            "apps/studio/workspace/products/singlepage/catalog.yaml",
            "apps/studio/workspace/products/startup/catalog.yaml",
          ]
        : [`apps/studio/workspace/products/${id}/catalog.yaml`],
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

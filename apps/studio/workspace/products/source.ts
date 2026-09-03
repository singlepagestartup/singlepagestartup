import type { ComponentType } from "react";

import singlepageAssets from "../assets/singlepage.yaml?raw";
import startupAssets from "../assets/startup.yaml?raw";
import singlepageBrand from "../brand/singlepage.md?raw";
import startupBrand from "../brand/startup.md?raw";
import singlepageBrief from "../brief/singlepage.md?raw";
import startupBrief from "../brief/startup.md?raw";
import singlepageBusiness from "../business/singlepage.md?raw";
import startupBusiness from "../business/startup.md?raw";
import singlepageDesign from "../design/singlepage.md?raw";
import startupDesign from "../design/startup.md?raw";
import singlepageEvidence from "../evidence/singlepage.md?raw";
import startupEvidence from "../evidence/startup.md?raw";
import {
  combineProjectWorkspaces,
  projectArtifactWorkspaces,
} from "../project-source";
import { portfolioDocumentsForProduct } from "../portfolio/source";
import singlepageStrategy from "../strategy/singlepage.md?raw";
import startupStrategy from "../strategy/startup.md?raw";
import type { IStudioArtifact, IStudioWorkspace } from "../types";
import {
  parseProductCatalog,
  resolveProductCatalog,
  type IProductCatalog,
  type IProductCatalogEntry,
  type ProductCatalogLayer,
} from "./catalog";
import singlepageCatalogSource from "./singlepage.yaml?raw";
import startupCatalogSource from "./startup.yaml?raw";
import {
  projectPresentationData,
  type IProjectPresentationData,
  type ProjectPresentationProjection,
} from "./presentation-data";

const markdownSources = import.meta.glob<string>(
  "./{singlepage,startup}/**/*.md",
  { eager: true, import: "default", query: "?raw" },
);

interface IPresentationModule {
  default?: ComponentType<{ data: IProjectPresentationData }>;
}

interface IProductSurfaceModule {
  default?: ComponentType;
}

const presentationModules = import.meta.glob<IPresentationModule>(
  "./{singlepage,startup}/**/presentation/ProjectPresentation.tsx",
  { eager: true },
);

const websiteModules = import.meta.glob<IProductSurfaceModule>(
  "./{singlepage,startup}/**/website/Website.tsx",
  { eager: true },
);

const contentModules = {
  ...import.meta.glob<IProductSurfaceModule>(
    "./{singlepage,startup}/**/content/Content.tsx",
    { eager: true },
  ),
  ...import.meta.glob<IProductSurfaceModule>(
    "./{singlepage,startup}/**/video/Video.tsx",
    { eager: true },
  ),
};

const globalDefinitions = [
  projectArtifactWorkspaces({
    kind: "brief",
    singlepage: singlepageBrief,
    startup: startupBrief,
  }),
  projectArtifactWorkspaces({
    kind: "business",
    singlepage: singlepageBusiness,
    startup: startupBusiness,
  }),
  projectArtifactWorkspaces({
    kind: "strategy",
    singlepage: singlepageStrategy,
    startup: startupStrategy,
  }),
  projectArtifactWorkspaces({
    kind: "brand",
    singlepage: singlepageBrand,
    startup: startupBrand,
  }),
  projectArtifactWorkspaces({
    kind: "design",
    singlepage: singlepageDesign,
    startup: startupDesign,
  }),
  projectArtifactWorkspaces({
    kind: "evidence",
    singlepage: singlepageEvidence,
    startup: startupEvidence,
  }),
  projectArtifactWorkspaces({
    kind: "asset-index",
    singlepage: singlepageAssets,
    startup: startupAssets,
  }),
];

const globalWorkspaces = {
  default: combineProjectWorkspaces(
    globalDefinitions.map((definition) => definition.default),
  ),
  singlepage: combineProjectWorkspaces(
    globalDefinitions.map((definition) => definition.singlepage),
  ),
  startup: combineProjectWorkspaces(
    globalDefinitions.map((definition) => definition.startup),
  ),
};

export interface IProductDocument {
  content: string;
  kind: "creative" | "product" | "research" | "sales" | "website";
  label:
    | "01 Research"
    | "02 Sales"
    | "03 Product Overview"
    | "04 Website"
    | "05 Marketing Creative";
  sourcePath: string;
}

export interface IProductView {
  content?: IProductSurface;
  documents: IProductDocument[];
  id: string;
  name: string;
  presentation: {
    Component: ComponentType<{ data: IProjectPresentationData }>;
    data: IProjectPresentationData;
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
  return `./${layer}/${relativePath}`;
}

function markdown(layer: ProductCatalogLayer, relativePath: string): string {
  const source = markdownSources[moduleKey(layer, relativePath)];
  if (typeof source !== "string") {
    throw new Error(
      `Missing product document: products/${layer}/${relativePath}`,
    );
  }
  return source;
}

function productArtifact(
  entry: IProductCatalogEntry,
  layer: ProductCatalogLayer,
  kind: IProductDocument["kind"],
  relativePath: string,
): IStudioArtifact {
  const sourcePath = `apps/studio/workspace/products/${layer}/${relativePath}`;
  return {
    content: markdown(layer, relativePath),
    description: `${entry.name} ${kind}`,
    id: `${layer}.product.${entry.id}.${kind}`,
    inherited: false,
    kind,
    layer,
    resolution: "local",
    sourceIds: [`${layer}.product.${entry.id}.${kind}`],
    sourcePath,
    sourcePaths: [sourcePath],
    usedBy: [],
    uses: [],
  };
}

function productWorkspace(
  base: IStudioWorkspace,
  entry: IProductCatalogEntry,
  layer: ProductCatalogLayer,
): IStudioWorkspace {
  return {
    ...base,
    artifacts: [
      ...base.artifacts,
      productArtifact(entry, layer, "product", entry.product),
      productArtifact(entry, layer, "website", entry.website),
      productArtifact(entry, layer, "creative", entry.marketing_creative),
    ],
  };
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
  const base = globalWorkspaces[id];
  const projection: ProjectPresentationProjection = catalog.layer;
  const products = catalog.products.map((entry) => {
    const workspace = productWorkspace(base, entry, catalog.layer);
    const portfolioDocuments = portfolioDocumentsForProduct(
      catalog.layer,
      entry.id,
    );
    const presentationPath = moduleKey(catalog.layer, entry.presentation);
    const Component = presentationModules[presentationPath]?.default;
    if (!Component) {
      throw new Error(
        `Missing product presentation: products/${catalog.layer}/${entry.presentation}`,
      );
    }
    return {
      content: productSurface(
        contentModules,
        catalog.layer,
        entry.content,
        "content",
      ),
      documents: [
        ...portfolioDocuments,
        {
          content: markdown(catalog.layer, entry.product),
          kind: "product" as const,
          label: "03 Product Overview" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.product}`,
        },
        {
          content: markdown(catalog.layer, entry.website),
          kind: "website" as const,
          label: "04 Website" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.website}`,
        },
        {
          content: markdown(catalog.layer, entry.marketing_creative),
          kind: "creative" as const,
          label: "05 Marketing Creative" as const,
          sourcePath: `apps/studio/workspace/products/${catalog.layer}/${entry.marketing_creative}`,
        },
      ],
      id: entry.id,
      name: entry.name,
      presentation: {
        Component,
        data: projectPresentationData(workspace, projection),
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
      "apps/studio/workspace/products/singlepage.yaml",
      ...(id === "singlepage"
        ? []
        : ["apps/studio/workspace/products/startup.yaml"]),
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

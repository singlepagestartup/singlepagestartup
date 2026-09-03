import singlepagePortfolioSource from "./singlepage.yaml?raw";
import startupPortfolioSource from "./startup.yaml?raw";
import {
  activeProductDirection,
  parsePortfolioCatalog,
  resolvePortfolioCatalog,
  type IPortfolioCatalog,
  type IPortfolioDirection,
  type PortfolioLayer,
} from "./catalog";
import { parseSalesProcess, salesProcessMarkdown } from "./sales";

const researchSources = import.meta.glob<string>(
  "./{singlepage,startup}/**/research.md",
  { eager: true, import: "default", query: "?raw" },
);
const salesSources = import.meta.glob<string>(
  "./{singlepage,startup}/**/sales.yaml",
  { eager: true, import: "default", query: "?raw" },
);

export interface IPortfolioDocument {
  content: string;
  kind: "research" | "sales";
  label: "01 Research" | "02 Sales";
  sourcePath: string;
}

export interface IPortfolioDirectionView {
  documents: IPortfolioDocument[];
  entry: IPortfolioDirection;
}

export interface IPortfolioCatalogView {
  directions: IPortfolioDirectionView[];
  id: "default" | PortfolioLayer;
  inherited: boolean;
  label: string;
  sourcePaths: string[];
}

const catalogs: Record<PortfolioLayer, IPortfolioCatalog> = {
  singlepage: parsePortfolioCatalog(singlepagePortfolioSource, "singlepage"),
  startup: parsePortfolioCatalog(startupPortfolioSource, "startup"),
};

function moduleKey(layer: PortfolioLayer, relativePath: string): string {
  return `./${layer}/${relativePath}`;
}

function sourcePath(layer: PortfolioLayer, relativePath: string): string {
  return `apps/studio/workspace/portfolio/${layer}/${relativePath}`;
}

function documents(
  catalog: IPortfolioCatalog,
  entry: IPortfolioDirection,
): IPortfolioDocument[] {
  const research = researchSources[moduleKey(catalog.layer, entry.research)];
  if (typeof research !== "string") {
    throw new Error(
      `Missing direction research: portfolio/${catalog.layer}/${entry.research}`,
    );
  }
  const result: IPortfolioDocument[] = [
    {
      content: research,
      kind: "research",
      label: "01 Research",
      sourcePath: sourcePath(catalog.layer, entry.research),
    },
  ];
  if (entry.sales) {
    const sales = salesSources[moduleKey(catalog.layer, entry.sales)];
    if (typeof sales !== "string") {
      throw new Error(
        `Missing sales process: portfolio/${catalog.layer}/${entry.sales}`,
      );
    }
    result.push({
      content: salesProcessMarkdown(parseSalesProcess(sales, entry.id)),
      kind: "sales",
      label: "02 Sales",
      sourcePath: sourcePath(catalog.layer, entry.sales),
    });
  }
  return result;
}

function view(
  id: IPortfolioCatalogView["id"],
  catalog: IPortfolioCatalog,
  inherited: boolean,
): IPortfolioCatalogView {
  const sourcePaths = [
    `apps/studio/workspace/portfolio/${catalog.layer}.yaml`,
    ...catalog.directions.flatMap((entry) =>
      documents(catalog, entry).map((document) => document.sourcePath),
    ),
  ];
  return {
    directions: catalog.directions.map((entry) => ({
      documents: documents(catalog, entry),
      entry,
    })),
    id,
    inherited,
    label:
      id === "default"
        ? inherited
          ? "default · inherited singlepage"
          : "default · startup"
        : id,
    sourcePaths,
  };
}

const resolved = resolvePortfolioCatalog(catalogs.singlepage, catalogs.startup);

export const portfolioCatalogViews = {
  default: view("default", resolved.catalog, resolved.inherited),
  singlepage: view("singlepage", catalogs.singlepage, false),
  startup: view("startup", catalogs.startup, false),
};

export function portfolioDocumentsForProduct(
  layer: PortfolioLayer,
  productId: string,
): IPortfolioDocument[] {
  const catalog = catalogs[layer];
  return documents(catalog, activeProductDirection(catalog, productId));
}

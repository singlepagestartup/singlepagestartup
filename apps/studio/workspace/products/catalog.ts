import { parse } from "yaml";

export type ProductCatalogLayer = "singlepage" | "startup";

export interface IProductCatalogEntry {
  content?: string;
  id: string;
  marketing_creative: string;
  name: string;
  presentation: string;
  product: string;
  summary: string;
  website: string;
  website_component?: string;
}

export interface IProductCatalog {
  layer: ProductCatalogLayer;
  products: IProductCatalogEntry[];
  schema: "singlepagestartup.product-catalog.v1";
}

function safeRelativePath(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.startsWith("/") ||
    value.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`${field} must be a safe layer-relative path`);
  }
  return value.replaceAll("\\", "/");
}

function optionalSafeRelativePath(
  value: unknown,
  field: string,
): string | undefined {
  return value === undefined ? undefined : safeRelativePath(value, field);
}

export function parseProductCatalog(
  source: string,
  layer: ProductCatalogLayer,
): IProductCatalog {
  const value = parse(source) as Record<string, unknown> | null;
  if (value?.schema !== "singlepagestartup.product-catalog.v1") {
    throw new Error(`${layer} products use an unsupported schema`);
  }
  if (!Array.isArray(value.products)) {
    throw new Error(`${layer} products must be an array`);
  }
  const ids = new Set<string>();
  const products = value.products.map((raw, index) => {
    const product = raw as Record<string, unknown>;
    const id = typeof product.id === "string" ? product.id.trim() : "";
    const name = typeof product.name === "string" ? product.name.trim() : "";
    const summary =
      typeof product.summary === "string" ? product.summary.trim() : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${layer} products[${index}].id must be kebab-case`);
    }
    if (ids.has(id)) throw new Error(`${layer} repeats product ${id}`);
    ids.add(id);
    if (!name || !summary) {
      throw new Error(`${layer} product ${id} needs name and summary`);
    }
    if (product.content !== undefined && product.video !== undefined) {
      throw new Error(
        `${layer} product ${id} cannot define both content and legacy video`,
      );
    }
    return {
      content: optionalSafeRelativePath(
        product.content ?? product.video,
        `${layer}.${id}.content`,
      ),
      id,
      marketing_creative: safeRelativePath(
        product.marketing_creative,
        `${layer}.${id}.marketing_creative`,
      ),
      name,
      presentation: safeRelativePath(
        product.presentation,
        `${layer}.${id}.presentation`,
      ),
      product: safeRelativePath(product.product, `${layer}.${id}.product`),
      summary,
      website: safeRelativePath(product.website, `${layer}.${id}.website`),
      website_component: optionalSafeRelativePath(
        product.website_component,
        `${layer}.${id}.website_component`,
      ),
    };
  });
  return {
    layer,
    products,
    schema: "singlepagestartup.product-catalog.v1",
  };
}

export function resolveProductCatalog(
  singlepage: IProductCatalog,
  startup: IProductCatalog,
): { catalog: IProductCatalog; inherited: boolean } {
  return startup.products.length > 0
    ? { catalog: startup, inherited: false }
    : { catalog: singlepage, inherited: true };
}

import { parse } from "yaml";

export type ProductCatalogLayer = "singlepage" | "startup";

export interface IProductPage {
  id: string;
  title: string;
  source?: string;
  export?: "pdf";
  children: IProductPage[];
}

export interface IProductSection {
  id: string;
  title: string;
  pages: IProductPage[];
}

export interface IProductCatalogEntry {
  sections: IProductSection[];
  content?: string;
  id: string;
  marketing_creative: string;
  name: string;
  presentation: string;
  presentation_data: string;
  product: string;
  research: string;
  sales: string;
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

function record(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${context} must be an object`);
  return value as Record<string, unknown>;
}

function namedNode(value: unknown, context: string) {
  const node = record(value, context);
  const id = typeof node.id === "string" ? node.id.trim() : "";
  const title = typeof node.title === "string" ? node.title.trim() : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !title)
    throw new Error(`${context} needs a kebab-case id and title`);
  return { node, id, title };
}

function pages(
  value: unknown,
  productId: string,
  ids: Set<string>,
): IProductPage[] {
  if (!Array.isArray(value) || !value.length)
    throw new Error(`${productId} section/group needs pages`);
  return value.map((raw) => {
    const { node, id, title } = namedNode(raw, `${productId} page`);
    if (id === "overview" || ids.has(id))
      throw new Error(`${productId} page id ${id} is reserved or repeated`);
    ids.add(id);
    const source = optionalSafeRelativePath(
      node.source,
      `${productId}.${id}.source`,
    );
    if (
      source &&
      (!source.startsWith(`${productId}/`) || /[?#%:]/.test(source))
    )
      throw new Error(
        `${productId}.${id} source must stay inside its product folder`,
      );
    const children =
      node.children === undefined ? [] : pages(node.children, productId, ids);
    if (!source && !children.length)
      throw new Error(`${productId}.${id} needs a source or children`);
    if (
      node.export !== undefined &&
      (node.export !== "pdf" || !source || !/\.[jt]sx$/i.test(source))
    )
      throw new Error(`${productId}.${id} PDF export requires a React page`);
    return {
      id,
      title,
      source,
      children,
      export: node.export as "pdf" | undefined,
    };
  });
}

function sections(value: unknown, productId: string): IProductSection[] {
  if (value === undefined) return [];
  if (!Array.isArray(value))
    throw new Error(`${productId}.sections must be an array`);
  const ids = new Set<string>();
  return value.map((raw) => {
    const { node, id, title } = namedNode(raw, `${productId} section`);
    if (ids.has(id)) throw new Error(`${productId} repeats section ${id}`);
    ids.add(id);
    return { id, title, pages: pages(node.pages, productId, new Set()) };
  });
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
    const productSections = sections(product.sections, id);
    if (
      (product.content !== undefined || product.video !== undefined) &&
      productSections.some((section) => section.id === "content")
    )
      throw new Error(
        `${layer}.${id} cannot define both content and sections.content`,
      );
    return {
      sections: productSections,
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
      presentation_data: safeRelativePath(
        product.presentation_data,
        `${layer}.${id}.presentation_data`,
      ),
      research: safeRelativePath(product.research, `${layer}.${id}.research`),
      sales: safeRelativePath(product.sales, `${layer}.${id}.sales`),
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

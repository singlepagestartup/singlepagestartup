import { parse } from "yaml";

export type ProductCatalogLayer = "singlepage" | "startup";

export function productStoryId(layer: ProductCatalogLayer, productId: string) {
  return `workspace-40-products-${layer}--product-${productId}`;
}

export interface IProductPage {
  id: string;
  title: string;
  source?: string;
  route?: string;
  representations?: { text: string; preview?: string };
  export?: "pdf";
  children: IProductPage[];
}

export interface IProductSection {
  id: string;
  title: string;
  pages: IProductPage[];
}

export interface IProductCatalogEntry {
  model?: string;
  sections: IProductSection[];
  content?: string;
  id: string;
  marketing_creative?: string;
  name: string;
  presentation?: string;
  presentation_data?: string;
  product: string;
  research: string;
  sales: string;
  summary: string;
  website?: string;
  website_component?: string;
}

export interface IProductCatalog {
  models: IProductModel[];
  layer: ProductCatalogLayer;
  products: IProductCatalogEntry[];
  schema:
    | "singlepagestartup.product-catalog.v1"
    | "singlepagestartup.product-catalog.v2";
}

export interface IProductModel {
  id: string;
  name: string;
  source: string;
  uses: string[];
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
    const owned = (path: string | undefined) => {
      if (path && (!path.startsWith(`${productId}/`) || /[?#%:]/.test(path)))
        throw new Error(
          `${productId}.${id} source must stay inside its product folder`,
        );
      return path;
    };
    owned(source);
    let representations: IProductPage["representations"];
    if (node.representations !== undefined) {
      if (source)
        throw new Error(
          `${productId}.${id} cannot mix source and representations`,
        );
      const variants = record(
        node.representations,
        `${productId}.${id}.representations`,
      );
      const text = owned(
        safeRelativePath(variants.text, `${productId}.${id}.text`),
      )!;
      const preview = owned(
        optionalSafeRelativePath(
          variants.preview,
          `${productId}.${id}.preview`,
        ),
      );
      if (!/\.md$/i.test(text))
        throw new Error(`${productId}.${id} text must be Markdown`);
      if (preview && !/\.(tsx|jsx|html|htm)$/i.test(preview))
        throw new Error(`${productId}.${id} preview must be React or HTML`);
      representations = { text, preview };
    }
    const route = node.route;
    if (
      route !== undefined &&
      (typeof route !== "string" ||
        !route.startsWith("/") ||
        /[\s?#]/.test(route))
    )
      throw new Error(`${productId}.${id} route must be a site path`);
    const children =
      node.children === undefined ? [] : pages(node.children, productId, ids);
    if (!source && !representations && !children.length)
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
      route: route as string | undefined,
      representations,
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
  if (
    value?.schema !== "singlepagestartup.product-catalog.v1" &&
    value?.schema !== "singlepagestartup.product-catalog.v2"
  ) {
    throw new Error(`${layer} products use an unsupported schema`);
  }
  if (!Array.isArray(value.products)) {
    throw new Error(`${layer} products must be an array`);
  }
  const modelIds = new Set<string>();
  if (value.models !== undefined && !Array.isArray(value.models))
    throw new Error(`${layer}.models must be an array`);
  const models: IProductModel[] = ((value.models ?? []) as unknown[]).map(
    (raw) => {
      const model = record(raw, `${layer} model`);
      const id = typeof model.id === "string" ? model.id.trim() : "";
      const name = typeof model.name === "string" ? model.name.trim() : "";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || modelIds.has(id) || !name)
        throw new Error(`${layer} model needs a unique kebab-case id and name`);
      modelIds.add(id);
      const source = safeRelativePath(model.source, `${layer}.${id}.source`);
      if (
        !source.startsWith(`models/${id}/`) ||
        !source.endsWith(".md") ||
        /[?#%:]/.test(source)
      )
        throw new Error(
          `${layer}.${id} model source must be Markdown in models/${id}/`,
        );
      if (
        model.uses !== undefined &&
        (!Array.isArray(model.uses) ||
          model.uses.some((item) => typeof item !== "string"))
      )
        throw new Error(`${layer}.${id}.uses must contain model IDs`);
      return { id, name, source, uses: (model.uses ?? []) as string[] };
    },
  );
  const visitModel = (id: string, trail: string[] = []) => {
    if (trail.includes(id))
      throw new Error(`Model dependency cycle: ${[...trail, id].join(" -> ")}`);
    const model = models.find((candidate) => candidate.id === id);
    if (!model) throw new Error(`${layer} references missing model ${id}`);
    model.uses.forEach((dependency) => visitModel(dependency, [...trail, id]));
  };
  models.forEach(({ id }) => visitModel(id));
  if (!value.products.length && models.length)
    throw new Error(
      `${layer} empty product catalog cannot define orphan models`,
    );
  const ids = new Set<string>();
  const products = value.products.map((raw, index) => {
    const product = raw as Record<string, unknown>;
    const id = typeof product.id === "string" ? product.id.trim() : "";
    const name = typeof product.name === "string" ? product.name.trim() : "";
    const summary =
      typeof product.summary === "string" ? product.summary.trim() : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id === "models") {
      throw new Error(`${layer} products[${index}].id must be kebab-case`);
    }
    if (ids.has(id)) throw new Error(`${layer} repeats product ${id}`);
    ids.add(id);
    if (!name || !summary) {
      throw new Error(`${layer} product ${id} needs name and summary`);
    }
    const model = typeof product.model === "string" ? product.model : undefined;
    if (
      (value.schema === "singlepagestartup.product-catalog.v2" && !model) ||
      (model && !modelIds.has(model))
    )
      throw new Error(`${layer}.${id} needs a model from its own catalog`);
    if (Boolean(product.presentation) !== Boolean(product.presentation_data))
      throw new Error(
        `${layer}.${id} presentation and presentation_data must be declared together`,
      );
    const materialPath =
      value.schema === "singlepagestartup.product-catalog.v2"
        ? optionalSafeRelativePath
        : safeRelativePath;
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
      model,
      sections: productSections,
      content: optionalSafeRelativePath(
        product.content ?? product.video,
        `${layer}.${id}.content`,
      ),
      id,
      marketing_creative: materialPath(
        product.marketing_creative,
        `${layer}.${id}.marketing_creative`,
      ),
      name,
      presentation: materialPath(
        product.presentation,
        `${layer}.${id}.presentation`,
      ),
      product: safeRelativePath(product.product, `${layer}.${id}.product`),
      presentation_data: materialPath(
        product.presentation_data,
        `${layer}.${id}.presentation_data`,
      ),
      research: safeRelativePath(product.research, `${layer}.${id}.research`),
      sales: safeRelativePath(product.sales, `${layer}.${id}.sales`),
      summary,
      website: materialPath(product.website, `${layer}.${id}.website`),
      website_component: optionalSafeRelativePath(
        product.website_component,
        `${layer}.${id}.website_component`,
      ),
    };
  });
  for (const product of products) {
    for (const field of [
      "product",
      "research",
      "sales",
      "website",
      "marketing_creative",
      "presentation",
      "presentation_data",
      "content",
      "website_component",
    ] as const) {
      const source = product[field];
      if (
        source &&
        (!source.startsWith(`${product.id}/`) || /[?#%:]/.test(source))
      )
        throw new Error(
          `${layer}.${product.id}.${field} must stay inside its product folder`,
        );
    }
  }
  return {
    models,
    layer,
    products,
    schema: value.schema,
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

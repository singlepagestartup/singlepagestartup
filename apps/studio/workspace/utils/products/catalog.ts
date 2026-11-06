import { parse } from "yaml";

export type ProductCatalogLayer = "singlepage" | "startup";

export function productStoryId(
  layer: ProductCatalogLayer,
  productId: string,
  document = "product",
) {
  return `workspace-10-products-${layer}-${productId}--${document}`;
}

export function materialStoryId(
  layer: ProductCatalogLayer,
  productId: string,
  material: string,
  group?: string,
) {
  return `workspace-50-materials-${layer}-${productId}${group ? `-${group}` : ""}--${material}`;
}

/** Product working documents in reading order. */
export function productDocumentEntries(product: IProductCatalogEntry) {
  return [
    { id: "product", title: "Описание", source: product.product },
    { id: "audience", title: "Аудитория", source: product.audience },
    { id: "competitors", title: "Конкуренты", source: product.competitors },
    { id: "semantics", title: "Семантика", source: product.semantics },
    {
      id: "economics",
      title: "Экономика",
      source: product.economics,
    },
    { id: "sales", title: "Продажи", source: product.sales },
  ].filter(
    (document): document is { id: string; title: string; source: string } =>
      Boolean(document.source),
  );
}

/** Sources belonging to the product materials. */
export function productMaterialEntries(product: IProductCatalogEntry) {
  const entries: { id: string; title: string; source?: string }[] = [];
  if (product.website)
    entries.push({
      id: "website",
      title: "Требования к сайту",
      source: product.website,
    });
  if (product.marketing_creative)
    entries.push({
      id: "creative",
      title: "Требования к креативам",
      source: product.marketing_creative,
    });
  for (const section of product.sections.filter(({ id }) =>
    ["website", "creative", "articles"].includes(id),
  )) {
    const visit = (pages: IProductPage[]) =>
      pages.forEach((page) => {
        if (page.source)
          entries.push({
            id: `${section.id}-${page.id}`,
            title: page.title,
            source: page.source,
          });
        visit(page.children);
      });
    visit(section.pages);
  }
  if (product.presentation)
    entries.push({
      id: "presentation",
      title: "Презентация",
      source: product.presentation,
    });
  return entries;
}

interface IMaterialNavigationNode {
  id: string;
  children: IMaterialNavigationNode[];
}

/** A derivative opens the complete material that owns it. */
export function materialNavigationTarget(
  product: { sections: { id: string; pages: IMaterialNavigationNode[] }[] },
  materialId: string,
): { group?: string; story: string; anchor?: string } {
  if (materialId === "website" || materialId === "website-landing")
    return { group: "website", story: "website" };
  if (materialId === "creative" || materialId.startsWith("creative-"))
    return { group: "creative", story: "creative", anchor: materialId };
  const contains = (page: IMaterialNavigationNode): boolean =>
    `articles-${page.id}` === materialId || page.children.some(contains);
  const article = product.sections
    .find(({ id }) => id === "articles")
    ?.pages.find(contains);
  if (article)
    return {
      group: "articles",
      story: `articles-${article.id}`,
      anchor: materialId,
    };
  return {
    group: materialId === "presentation" ? materialId : undefined,
    story: materialId,
  };
}

export function materialNavigationOwner(
  product: { sections: { id: string; pages: IMaterialNavigationNode[] }[] },
  materialId: string,
): string | undefined {
  return materialNavigationTarget(product, materialId).group;
}

export interface IProductMaterialStoryGroup {
  id: string;
  title: string;
  items: { id: string; title: string }[];
}

/** Products are folders; each complete material is one story. */
export function productMaterialStoryGroups(
  product: IProductCatalogEntry,
): IProductMaterialStoryGroup[] {
  const groups: IProductMaterialStoryGroup[] = [];
  const add = (id: string, title: string) =>
    groups.push({ id, title, items: [{ id, title }] });
  if (product.website || product.sections.some(({ id }) => id === "website"))
    add("website", "Сайт");
  if (product.presentation) add("presentation", "Презентация");
  if (
    product.marketing_creative ||
    product.sections.some(({ id }) => id === "creative")
  )
    add("creative", "Рекламные материалы");
  const articles =
    product.sections.find(({ id }) => id === "articles")?.pages ?? [];
  if (articles.length)
    groups.push({
      id: "articles",
      title: "Статьи",
      items: articles.map((article) => ({
        id: `articles-${article.id}`,
        title: article.title,
      })),
    });
  return groups;
}

export interface IProductPage {
  id: string;
  title: string;
  source?: string;
  route?: string;
  uses?: string[];
  export?: "pdf";
  children: IProductPage[];
}

export interface IProductSection {
  id: string;
  title: string;
  pages: IProductPage[];
}

export interface IProductCatalogEntry {
  audience: string;
  competitors: string;
  semantics: string;
  economics: string;
  sections: IProductSection[];
  id: string;
  marketing_creative?: string;
  name: string;
  presentation?: string;
  product: string;
  sales: string;
  summary: string;
  website?: string;
}

export interface IProductCatalog {
  layer: ProductCatalogLayer;
  products: IProductCatalogEntry[];
  schema: "singlepagestartup.product-catalog.v2";
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
    for (const key of Object.keys(node))
      if (
        ![
          "id",
          "title",
          "source",
          "route",
          "uses",
          "children",
          "export",
        ].includes(key)
      )
        throw new Error(`${productId}.${id} has unknown page field ${key}`);
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
    const route = node.route;
    if (
      route !== undefined &&
      (typeof route !== "string" ||
        !route.startsWith("/") ||
        /[\s?#]/.test(route))
    )
      throw new Error(`${productId}.${id} route must be a site path`);
    const uses = node.uses ?? [];
    if (
      !Array.isArray(uses) ||
      uses.some(
        (dependency) =>
          typeof dependency !== "string" ||
          !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(dependency),
      )
    )
      throw new Error(`${productId}.${id}.uses must contain document IDs`);
    const children =
      node.children === undefined ||
      (Array.isArray(node.children) && node.children.length === 0)
        ? []
        : pages(node.children, productId, ids);
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
      route: route as string | undefined,
      uses: [...new Set(uses as string[])],
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
    if (id === "research")
      throw new Error(
        `${productId}: research belongs in visible audience, competitors and semantics documents`,
      );
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
  if (value?.schema !== "singlepagestartup.product-catalog.v2") {
    throw new Error(`${layer} products use an unsupported schema`);
  }
  if (!Array.isArray(value.products)) {
    throw new Error(`${layer} products must be an array`);
  }
  const rootKeys = new Set(["schema", "products"]);
  for (const key of Object.keys(value))
    if (!rootKeys.has(key))
      throw new Error(`${layer} catalog has unknown field ${key}`);
  const ids = new Set<string>();
  const products = value.products.map((raw, index) => {
    const product = record(raw, `${layer} product`);
    const fields = new Set([
      "id",
      "name",
      "summary",
      "product",
      "audience",
      "competitors",
      "semantics",
      "economics",
      "sales",
      "website",
      "marketing_creative",
      "presentation",
      "sections",
    ]);
    for (const key of Object.keys(product))
      if (!fields.has(key))
        throw new Error(`${layer} product has unknown field ${key}`);
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
    const productSections = sections(product.sections, id);
    return {
      audience: safeRelativePath(product.audience, `${layer}.${id}.audience`),
      competitors: safeRelativePath(
        product.competitors,
        `${layer}.${id}.competitors`,
      ),
      semantics: safeRelativePath(
        product.semantics,
        `${layer}.${id}.semantics`,
      ),
      economics: safeRelativePath(
        product.economics,
        `${layer}.${id}.economics`,
      ),
      sections: productSections,
      id,
      marketing_creative: optionalSafeRelativePath(
        product.marketing_creative,
        `${layer}.${id}.marketing_creative`,
      ),
      name,
      presentation: optionalSafeRelativePath(
        product.presentation,
        `${layer}.${id}.presentation`,
      ),
      product: safeRelativePath(product.product, `${layer}.${id}.product`),
      sales: safeRelativePath(product.sales, `${layer}.${id}.sales`),
      summary,
      website: optionalSafeRelativePath(
        product.website,
        `${layer}.${id}.website`,
      ),
    };
  });
  for (const product of products) {
    for (const field of [
      "audience",
      "competitors",
      "semantics",
      "economics",
      "product",
      "sales",
      "website",
      "marketing_creative",
      "presentation",
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

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { loadCsf } from "storybook/internal/csf-tools";
import path from "node:path";
import { documentVisibleText, parseDocument } from "../workspace/document";
import {
  parseSalesProcess,
  type ISalesProcess,
} from "../../../apps/studio/workspace/utils/products/sales";
import {
  type IProductCatalog,
  type IProductPage,
  productDocumentEntries,
  productStoryId,
  materialStoryId,
  materialNavigationTarget,
  productMaterialStoryGroups,
} from "../../../apps/studio/workspace/utils/products/catalog";

const headings = (text: string) =>
  [
    ...documentVisibleText(parseDocument(text).body).matchAll(/^## (.+)$/gm),
  ].map((m) => m[1].trim());

export function validateDocumentStructure(
  source: string,
  template: string,
  label: string,
) {
  const actual = headings(source),
    expected = headings(template);
  if (actual.join("\n") !== expected.join("\n"))
    throw new Error(
      `${label}: разделы должны совпадать с шаблоном: ${expected.join(" → ")}`,
    );
}
export function validateMaterialJourney(
  source: string,
  sales: ISalesProcess,
  label: string,
) {
  const journey = parseDocument(source).metadata.journey as
    | { segment?: string; stage?: string }
    | undefined;
  const segment = sales.segments.find((item) => item.id === journey?.segment);
  if (!segment || !segment.journey.some((item) => item.id === journey?.stage))
    throw new Error(
      `${label}: journey.segment и journey.stage должны указывать на существующий этап продаж этого продукта`,
    );
}
export function validateVisibleLinks(
  source: string,
  label: string,
  stories: Set<string>,
) {
  const body = parseDocument(source).body;
  for (const match of body.matchAll(
    /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
  )) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
    const story = href.match(/[?&]path=\/story\/([^&#]+)/)?.[1];
    if (story) {
      if (!stories.has(decodeURIComponent(story)))
        throw new Error(`${label}: неизвестная история ${story}`);
      continue;
    }
    if (/\.(?:md|ya?ml|csv|tsx?)(?:[#?]|$)/.test(href))
      throw new Error(
        `${label}: ссылка на скрытый исходник ${href}; покажите данные на странице и используйте её Storybook URL`,
      );
  }
}

/** Resolve links to visible module stories using Storybook's own CSF parser. */
export async function moduleStoryIds(
  modulesRoot: string,
): Promise<Set<string>> {
  const ids = new Set<string>();
  if (!existsSync(modulesRoot)) return ids;
  const files = await readdir(modulesRoot, { recursive: true });
  for (const relative of files.filter((file) =>
    /\.stories\.tsx?$/.test(file),
  )) {
    const fileName = path.join(modulesRoot, relative);
    const csf = loadCsf(await readFile(fileName, "utf8"), {
      fileName,
      makeTitle: (title) => title,
    }).parse();
    for (const story of csf.stories) ids.add(story.id);
  }
  return ids;
}

export async function validateProductDocuments(
  catalog: IProductCatalog,
  layerRoot: string,
) {
  const workspaceRoot = path.resolve(layerRoot, "../..");
  const repo = path.resolve(workspaceRoot, "../../..");
  const stories = await moduleStoryIds(path.join(workspaceRoot, "../modules"));
  stories.add("workspace-readme--overview");
  for (const kind of ["brief", "strategy", "brand", "design"])
    for (const layer of ["default", "singlepage", "startup"])
      stories.add(`workspace-${kind}-${layer}--document`);
  const mdFiles = new Map<string, string>();
  for (const product of catalog.products) {
    for (const doc of productDocumentEntries(product)) {
      stories.add(productStoryId(catalog.layer, product.id, doc.id));
      if (doc.source.endsWith(".md")) mdFiles.set(doc.source, product.id);
    }
    for (const section of product.sections) {
      const collect = (page: IProductPage) => {
        const target = materialNavigationTarget(
          product,
          `${section.id}-${page.id}`,
        );

        if (page.source?.endsWith(".md")) mdFiles.set(page.source, product.id);
        page.children.forEach(collect);
      };
      section.pages.forEach(collect);
    }
    for (const group of productMaterialStoryGroups(product))
      for (const item of group.items)
        stories.add(
          materialStoryId(catalog.layer, product.id, item.id, group.id),
        );
    if (product.website) mdFiles.set(product.website, product.id);
    if (product.marketing_creative)
      mdFiles.set(product.marketing_creative, product.id);
  }
  const template = (name: string) =>
    readFile(path.join(repo, ".agents/templates", name), "utf8");
  for (const product of catalog.products) {
    const sales = parseSalesProcess(
      await readFile(path.join(layerRoot, product.sales), "utf8"),
      product.id,
    );
    const fixed: [string | undefined, string, boolean][] = [
      [product.product, "product.md", false],
      [product.audience, "product-audience.md", false],
      [product.competitors, "product-research-competitors.md", false],
      [product.semantics, "product-semantics.md", false],
      [product.economics, "product-economics.md", false],
      [product.website, "website.md", true],
      [product.marketing_creative, "creative.md", true],
    ];
    for (const section of product.sections) {
      if (section.id === "presentation")
        for (const page of section.pages)
          if (page.source?.endsWith(".md"))
            fixed.push([page.source, "presentation.md", true]);
      if (section.id === "articles")
        for (const page of section.pages)
          if (page.source?.endsWith(".md"))
            fixed.push([page.source, "article-package.md", true]);
    }
    for (const [file, name, material] of fixed) {
      if (!file) continue;
      const source = await readFile(path.join(layerRoot, file), "utf8");
      validateDocumentStructure(source, await template(name), file);
      if (material) validateMaterialJourney(source, sales, file);
    }
  }
  for (const file of mdFiles.keys())
    validateVisibleLinks(
      await readFile(path.join(layerRoot, file), "utf8"),
      file,
      stories,
    );
}

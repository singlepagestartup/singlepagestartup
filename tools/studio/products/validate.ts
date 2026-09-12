import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  IProductCatalog,
  IProductPage,
} from "../../../apps/studio/workspace/utils/products/catalog";
import { parseDocument } from "../workspace/document";
import { parseSalesProcess } from "../../../apps/studio/workspace/utils/products/sales";
import { parseProductPresentation } from "../../../apps/studio/workspace/utils/products/presentation-data";

export const productHeadings = [
  "Product identity",
  "Customer Segments",
  "Problem and desired progress",
  "Value Propositions",
  "Offer and usage",
  "Evidence and decision rules",
];
export const modelHeadings = [
  "Model scope",
  "Revenue Streams",
  "Delivery and resources",
  "Cost Structure",
  "Assumptions and decision rules",
];

/** Validate declared page files relative to the selected catalog, without fallback. */
export async function validateProductCatalogFiles(
  catalog: IProductCatalog,
  layerRoot: string,
) {
  async function requireFile(source: string): Promise<string> {
    const file = path.resolve(layerRoot, source);
    if (!file.startsWith(path.resolve(layerRoot) + path.sep))
      throw new Error(`Source outside product layer: ${source}`);
    const info = await stat(file).catch(() => undefined);
    if (!info?.isFile())
      throw new Error(`Missing product source: ${catalog.layer}/${source}`);
    return file;
  }
  async function primary(source: string, headings: string[]) {
    const body = parseDocument(
      await readFile(await requireFile(source), "utf8"),
    ).body;
    const actual = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    if (actual.join("|") !== headings.join("|"))
      throw new Error(
        `${source} must use canonical sections: ${headings.join(", ")}; preserve project extensions in catalog pages`,
      );
    const words = body
      .replace(/<!--[^]*?-->/g, "")
      .split(/\s+/)
      .filter(Boolean).length;
    if (words > 1400)
      throw new Error(`${source} exceeds 1,400 words (${words})`);
  }
  for (const model of catalog.models)
    await primary(model.source, modelHeadings);
  for (const product of catalog.products) {
    for (const field of [
      "research",
      "sales",
      "product",
      "website",
      "marketing_creative",
      "presentation",
      "presentation_data",
      "content",
      "website_component",
    ] as const) {
      const source = product[field];
      if (source) {
        if (!source.startsWith(`${product.id}/`))
          throw new Error(
            `${product.id}.${field} must stay in its product folder`,
          );
        await requireFile(source);
      }
    }
    if (catalog.schema.endsWith(".v2"))
      await primary(product.product, productHeadings);
    parseSalesProcess(
      await readFile(await requireFile(product.sales), "utf8"),
      product.id,
    );
    if (product.presentation_data)
      parseProductPresentation(
        await readFile(await requireFile(product.presentation_data), "utf8"),
        product.id,
      );
  }
}

export async function validateProductSectionFiles(
  catalog: IProductCatalog,
  layerRoot: string,
) {
  async function visit(page: IProductPage): Promise<void> {
    if (page.source) {
      const file = path.resolve(layerRoot, page.source);
      const info = await stat(file).catch(() => undefined);
      if (!info?.isFile())
        throw new Error(
          `Missing product page: ${catalog.layer}/${page.source}`,
        );
    }
    await Promise.all(page.children.map(visit));
  }
  await Promise.all(
    catalog.products.flatMap((product) =>
      product.sections.flatMap((section) => section.pages.map(visit)),
    ),
  );
}

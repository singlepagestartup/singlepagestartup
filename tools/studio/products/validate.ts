import { validateProductDocuments } from "./documents";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  IProductCatalog,
  IProductPage,
} from "../../../apps/studio/workspace/utils/products/catalog";
import { parseDocument } from "../workspace/document";
import {
  parseSalesProcess,
  validateSalesSegments,
} from "../../../apps/studio/workspace/utils/products/sales";

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
  for (const product of catalog.products) {
    for (const field of [
      "audience",
      "competitors",
      "semantics",
      "economics",
      "sales",
      "product",
      "website",
      "marketing_creative",
      "presentation",
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
    const sales = parseSalesProcess(
      await readFile(await requireFile(product.sales), "utf8"),
      product.id,
    );
    validateSalesSegments(
      sales,
      parseDocument(await readFile(await requireFile(product.product), "utf8"))
        .metadata.customer_segments,
    );
  }
  await validateProductDocuments(catalog, layerRoot);
}

export async function validateProductSectionFiles(
  catalog: IProductCatalog,
  layerRoot: string,
) {
  async function visit(page: IProductPage): Promise<void> {
    for (const source of [page.source].filter((value): value is string =>
      Boolean(value),
    )) {
      const file = path.resolve(layerRoot, source);
      const info = await stat(file).catch(() => undefined);
      if (!info?.isFile())
        throw new Error(`Missing product page: ${catalog.layer}/${source}`);
    }
    await Promise.all(page.children.map(visit));
  }
  await Promise.all(
    catalog.products.flatMap((product) =>
      product.sections.flatMap((section) => section.pages.map(visit)),
    ),
  );
}

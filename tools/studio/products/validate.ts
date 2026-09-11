import { stat } from "node:fs/promises";
import path from "node:path";
import type {
  IProductCatalog,
  IProductPage,
} from "../../../apps/studio/workspace/utils/products/catalog";

/** Validate declared page files relative to the selected catalog, without fallback. */
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

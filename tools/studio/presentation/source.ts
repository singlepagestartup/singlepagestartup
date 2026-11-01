import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseProductCatalog,
  resolveProductCatalog,
  productStoryId,
  type ProductCatalogLayer,
} from "../../../apps/studio/workspace/utils/products/catalog";

/** Select the current owning product story used by the standalone export. */
export function presentationStoryTarget(
  workspace: string,
  layer: ProductCatalogLayer,
  productId?: string,
) {
  const read = (source: ProductCatalogLayer) =>
    parseProductCatalog(
      readFileSync(
        path.join(workspace, "products", source, "catalog.yaml"),
        "utf8",
      ),
      source,
    );
  const singlepage = read("singlepage");
  const catalog =
    layer === "startup"
      ? resolveProductCatalog(singlepage, read("startup")).catalog
      : singlepage;
  const product = productId
    ? catalog.products.find(({ id }) => id === productId)
    : catalog.products.find(({ presentation }) => Boolean(presentation));
  if (!product?.presentation)
    throw new Error(
      `No presentation for ${productId ?? "the selected catalog"}.`,
    );
  return {
    productId: product.id,
    storyId: productStoryId(catalog.layer, product.id),
    source: `apps/studio/workspace/products/${catalog.layer}/${product.presentation}`,
  };
}

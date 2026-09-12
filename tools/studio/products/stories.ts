import {
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  parseProductCatalog,
  productStoryId,
  type ProductCatalogLayer,
} from "../../../apps/studio/workspace/utils/products/catalog";

/** Each source owns its sidebar products. Resolved default remains a loader concern. */
export function productStoryEntries(
  singlepageSource: string,
  startupSource: string,
) {
  return (["singlepage", "startup"] as const).flatMap((layer) => {
    const catalog = parseProductCatalog(
      layer === "singlepage" ? singlepageSource : startupSource,
      layer,
    );
    return catalog.products.map(({ id, name }, index) => ({
      id,
      layer,
      storyId: productStoryId(layer, id),
      title: `Workspace/40 Products/${layer}`,
      name: `${String(index + 1).padStart(2, "0")} ${name}`,
      exportName: `Product_${id.replaceAll("-", "_")}`,
    }));
  });
}

export function syncProductStories(workspace: string, outputDirectory: string) {
  const read = (layer: string) =>
    readFileSync(
      path.join(workspace, "products", layer, "catalog.yaml"),
      "utf8",
    );
  const entries = productStoryEntries(read("singlepage"), read("startup"));
  const relativeImport = (source: string) => {
    const relative = path
      .relative(outputDirectory, path.join(workspace, source))
      .replaceAll(path.sep, "/");
    return relative.startsWith(".") ? relative : `./${relative}`;
  };
  mkdirSync(outputDirectory, { recursive: true });
  const expected = new Set<string>();
  for (const layer of ["singlepage", "startup"] as ProductCatalogLayer[]) {
    const fileName = `${layer}.stories.tsx`;
    expected.add(fileName);
    const products = entries.filter((entry) => entry.layer === layer);
    const stories = products.length
      ? products
          .map(
            (entry) => `export const ${entry.exportName} = {
  name: ${JSON.stringify(entry.name)},
  tags: ["sps-product", "sps-source-${layer}"],
  args: { productId: ${JSON.stringify(entry.id)} },
};`,
          )
          .join("\n")
      : `export const Empty = { name: "No products", tags: ["sps-empty", "sps-source-${layer}"] };`;
    const source = `// Generated from the owning product catalog. Do not edit.
import { ProductCatalog } from ${JSON.stringify(relativeImport("utils/components/ProductCatalog"))};
import { productCatalogViews } from ${JSON.stringify(relativeImport("utils/products/source"))};
export default {
  id: "workspace-40-products-${layer}",
  title: "Workspace/40 Products/${layer}",
  component: ProductCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { view: productCatalogViews.${layer} },
};
${stories}
`;
    const file = path.join(outputDirectory, fileName);
    let previous: string | undefined;
    try {
      previous = readFileSync(file, "utf8");
    } catch {
      /* New derived source navigation. */
    }
    if (source !== previous) writeFileSync(file, source);
  }
  for (const fileName of readdirSync(outputDirectory))
    if (fileName.endsWith(".stories.tsx") && !expected.has(fileName))
      unlinkSync(path.join(outputDirectory, fileName));
  return entries;
}

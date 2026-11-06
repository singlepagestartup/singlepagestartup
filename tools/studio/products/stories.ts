import {
  existsSync,
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
  productDocumentEntries,
  productMaterialEntries,
  productMaterialStoryGroups,
} from "../../../apps/studio/workspace/utils/products/catalog";

/** Source folders contain product components; each working document is a native story. */
export function productStoryEntries(
  singlepageSource: string,
  startupSource: string,
) {
  return (["singlepage", "startup"] as const).flatMap((layer) => {
    const catalog = parseProductCatalog(
      layer === "singlepage" ? singlepageSource : startupSource,
      layer,
    );
    return catalog.products.map((product, index) => ({
      ...product,
      layer,
      storyId: productStoryId(layer, product.id),
      title: `Workspace/10 Продукты/${layer}/${String(index + 1).padStart(2, "0")} ${product.name.replaceAll("/", " · ")}`,
      documents: productDocumentEntries(product),
      materials: productMaterialEntries(product),
      materialGroups: productMaterialStoryGroups(product),
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
  const save = (fileName: string, text: string) => {
    expected.add(fileName);
    const file = path.join(outputDirectory, fileName);
    if (!existsSync(file) || readFileSync(file, "utf8") !== text)
      writeFileSync(file, text);
  };
  const header = `// Generated from the owning product catalog. Do not edit.
import { ProductCatalog } from ${JSON.stringify(relativeImport("utils/components/ProductCatalog"))};
import { ProductMaterials } from ${JSON.stringify(relativeImport("utils/components/ProductMaterials"))};
import { productCatalogViews } from ${JSON.stringify(relativeImport("utils/products/source"))};\n`;
  for (const product of entries) {
    const productArgs = `view: productCatalogViews.${product.layer}, productId: ${JSON.stringify(product.id)}`;
    save(
      `${product.layer}-${product.id}-10-products.stories.tsx`,
      header +
        `export default {
  id: ${JSON.stringify(`workspace-10-products-${product.layer}-${product.id}`)},
  title: ${JSON.stringify(product.title)},
  component: ProductCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { ${productArgs} },
};
${product.documents
  .map(
    (item, index) => `export const ${item.id.replaceAll("-", "_")} = {
  name: ${JSON.stringify(`${String(index + 1).padStart(2, "0")} ${item.title}`)},
  tags: ["sps-product-document", "sps-source-${product.layer}"],
  args: { documentId: ${JSON.stringify(item.id)} },
};`,
  )
  .join("\n")}
`,
    );
    const baseId = `workspace-50-materials-${product.layer}-${product.id}`;
    const productTitle = product.title.replace("10 Продукты", "50 Материалы");
    for (const [index, group] of product.materialGroups.entries()) {
      const groupTitle = `${String(index + 1).padStart(2, "0")} ${group.title.replaceAll("/", " · ")}`;
      save(
        `${product.layer}-${product.id}-50-materials-${group.id}.stories.tsx`,
        header +
          `export default {
  id: ${JSON.stringify(`${baseId}-${group.id}`)},
  title: ${JSON.stringify(`${productTitle}/${groupTitle}`)},
  component: ProductMaterials,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { ${productArgs} },
};
${group.items
  .map(
    (item, itemIndex) => `export const ${item.id.replaceAll("-", "_")} = {
  name: ${JSON.stringify(group.items.length === 1 && group.id !== "articles" ? groupTitle : `${String(itemIndex + 1).padStart(2, "0")} ${item.title}`)},
  tags: ["sps-product-material", "sps-source-${product.layer}"],
  args: { materialId: ${JSON.stringify(item.id)} },
};`,
  )
  .join("\n")}

`,
      );
    }
  }

  // Empty source layers remain visible without borrowing another business's products.
  for (const layer of ["singlepage", "startup"] as const) {
    if (entries.some((product) => product.layer === layer)) continue;
    for (const [area, label] of [
      ["10-products", "10 Продукты"],
      ["50-materials", "50 Материалы"],
    ] as const) {
      save(
        `${layer}-${area}-empty.stories.tsx`,
        header +
          `export default {
  id: "workspace-${area}-${layer}-empty",
  title: "Workspace/${label}/${layer}/${area === "10-products" ? "Каталог продуктов" : "Материалы продуктов"}",
  component: ProductCatalog,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { view: productCatalogViews.${layer} },
};
export const Empty = { name: "${area === "10-products" ? "Продуктов пока нет" : "Материалов пока нет"}" };
`,
      );
    }
  }
  for (const name of readdirSync(outputDirectory)) {
    if (name.endsWith(".stories.tsx") && !expected.has(name))
      unlinkSync(path.join(outputDirectory, name));
  }
  return entries;
}

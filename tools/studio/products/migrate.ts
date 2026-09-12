import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument as parseYamlDocument } from "yaml";
import { parseProductCatalog } from "../../../apps/studio/workspace/utils/products/catalog";
import { parseDocument } from "../workspace/document";

export interface IProductMigration {
  catalog: string;
  documents: Record<string, string>;
}

/** Mechanical migration only after model ownership has been explicitly supplied. */
export function migrateProductStructure(
  input: IProductMigration,
): IProductMigration {
  const catalog = parseYamlDocument(input.catalog);
  catalog.set("schema", "singlepagestartup.product-catalog.v2");
  if (!catalog.has("models")) catalog.set("models", []);
  const source = catalog.toString();
  const parsed = parseProductCatalog(source, "startup");
  const documents = { ...input.documents };
  for (const product of parsed.products) {
    if (documents[product.product] === undefined)
      throw new Error(`Missing Product source: ${product.product}`);
    // Headings are structural; metadata, unique paragraphs and extensions survive verbatim.
    documents[product.product] = documents[product.product]
      .replace(/^# Product Overview$/m, "# Product")
      .replace(/^## Best-fit customer$/m, "## Customer Segments")
      .replace(/^## Positioning and value$/m, "## Value Propositions");
  }
  return { catalog: source, documents };
}

export function businessTransferSections(source: string): string[] {
  const body = parseDocument(source).body.trim();
  if (!body) return [];
  const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  return headings.length ? headings : ["Complete Business body"];
}

async function main() {
  const args = process.argv.slice(2);
  const layer = args[args.indexOf("--layer") + 1];
  if (!["singlepage", "startup"].includes(layer))
    throw new Error(
      "Use --layer singlepage|startup; default is read-only, --apply-structure applies reviewed model assignments.",
    );
  const workspace = path.resolve("apps/studio/workspace");
  const layerRoot = path.join(workspace, "products", layer);
  const catalogPath = path.join(layerRoot, "catalog.yaml");
  const catalog = await readFile(catalogPath, "utf8");
  const parsed = parseProductCatalog(
    catalog,
    layer as "singlepage" | "startup",
  );
  const legacyBusiness = await readFile(
    path.join(workspace, "business", `${layer}.md`),
    "utf8",
  ).catch(() => "");
  const sections = businessTransferSections(legacyBusiness);
  const missingModels = parsed.products
    .filter((product) => !product.model)
    .map(({ id }) => id);
  console.log(
    JSON.stringify(
      {
        layer,
        schema: parsed.schema,
        products: parsed.products.map(({ id, model }) => ({ id, model })),
        missingModels,
        businessSectionsRequiringContentReview: sections,
        next: sections.length
          ? "Map each material statement to an owning source before retiring Business; this command never splits or deletes its content."
          : "Inspect sources and existing review metadata before recording any confirmation.",
      },
      null,
      2,
    ),
  );
  if (!args.includes("--apply-structure")) return;
  if (missingModels.length)
    throw new Error(
      "Choose model boundaries and create model sources/assignments first; one model per product is never inferred.",
    );
  for (const model of parsed.models)
    await readFile(path.join(layerRoot, model.source), "utf8");
  const documents = Object.fromEntries(
    await Promise.all(
      parsed.products.map(async (product) => [
        product.product,
        await readFile(path.join(layerRoot, product.product), "utf8"),
      ]),
    ),
  );
  const result = migrateProductStructure({ catalog, documents });
  for (const [relative, content] of Object.entries(result.documents))
    await writeFile(path.join(layerRoot, relative), content);
  await writeFile(catalogPath, result.catalog);
  console.log(
    "Catalog and canonical headings migrated. No approval/review fingerprint was renewed; Business content and all custom pages were retained for review.",
  );
}

if (import.meta.main)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

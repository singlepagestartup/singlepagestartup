import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { validateResearchFindingIds } from "./research-ids";
import type { IResearchFindingDocument } from "./research-ids";
import type {
  IProductCatalog,
  IProductPage,
} from "../../../apps/studio/workspace/utils/products/catalog";
import { parseDocument } from "../workspace/document";
import {
  parseSalesProcess,
  validateSalesSegments,
} from "../../../apps/studio/workspace/utils/products/sales";
import { parseProductPresentation } from "../../../apps/studio/workspace/utils/products/presentation-data";

export const productHeadings = [
  "Product identity",
  "Customer Segments",
  "Problem and desired progress",
  "Value Propositions",
  "Offer and usage",
  "Business goals and metrics",
];
export const modelHeadings = [
  "Model scope",
  "Revenue Streams",
  "Delivery and resources",
  "Cost Structure",
  "Assumptions and decision rules",
];
export const analyticsHeadings = [
  "Measurement scope",
  "Funnel observations",
  "Product usage and retention",
  "Revenue and cost observations",
  "Sources and limitations",
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
  }
  for (const model of catalog.models)
    await primary(model.source, modelHeadings);
  const researchDocuments: IResearchFindingDocument[] = [];
  for (const product of catalog.products) {
    for (const field of [
      "analytics",
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
    if (product.analytics) await primary(product.analytics, analyticsHeadings);
    const productResearch: IResearchFindingDocument[] = [
      {
        layer: catalog.layer,
        productId: product.id,
        sourcePath: product.research,
        source: await readFile(await requireFile(product.research), "utf8"),
      },
    ];
    async function collectResearch(page: IProductPage): Promise<void> {
      const source = page.representations?.text ?? page.source;
      if (
        source?.endsWith(".md") &&
        !productResearch.some((doc) => doc.sourcePath === source)
      )
        productResearch.push({
          layer: catalog.layer,
          productId: product.id,
          sourcePath: source,
          source: await readFile(await requireFile(source), "utf8"),
        });
      for (const child of page.children) await collectResearch(child);
    }
    for (const section of product.sections.filter(
      (section) => section.id === "research",
    ))
      for (const page of section.pages) await collectResearch(page);
    researchDocuments.push(...productResearch);
    const sales = parseSalesProcess(
      await readFile(await requireFile(product.sales), "utf8"),
      product.id,
    );
    validateSalesSegments(
      sales,
      parseDocument(await readFile(await requireFile(product.product), "utf8"))
        .metadata.customer_segments,
    );
    validateResearchSalesCoverage(
      productResearch,
      sales.segments.map((segment) => segment.id),
    );
    if (product.presentation_data)
      parseProductPresentation(
        await readFile(await requireFile(product.presentation_data), "utf8"),
        product.id,
      );
  }
  validateResearchFindingIds(researchDocuments);
}

export const salesResearchDimensions = [
  "needs",
  "motivations",
  "purchase_trigger",
  "decision_criteria",
  "objections",
  "acquisition",
  "journey",
] as const;

/** Audited Research covers every Sales segment; large catalogs have no count or word cap. */
export function validateResearchSalesCoverage(
  documents: IResearchFindingDocument[],
  segmentIds: string[],
) {
  if (parseDocument(documents[0].source).metadata.sales_audit !== true) return;
  if (!segmentIds.length)
    throw new Error(
      `${documents[0].sourcePath}: Sales audit requires segment profiles`,
    );
  const covered = new Set<string>();
  for (const document of documents) {
    const metadata = parseDocument(document.source).metadata;
    if (metadata.sales_segment === undefined) continue;
    const segment = metadata.sales_segment;
    if (typeof segment !== "string" || !segmentIds.includes(segment))
      throw new Error(
        `${document.sourcePath}: Unknown Sales segment ${String(segment)}`,
      );
    if (covered.has(segment))
      throw new Error(`Duplicate Research audit for Sales segment ${segment}`);
    covered.add(segment);
    const dimensions = metadata.sales_dimensions;
    if (
      !Array.isArray(dimensions) ||
      salesResearchDimensions.some(
        (dimension) => !dimensions.includes(dimension),
      )
    )
      throw new Error(
        `${document.sourcePath}: Research must inspect all Sales dimensions: ${salesResearchDimensions.join(", ")}`,
      );
  }
  const missing = segmentIds.filter((segment) => !covered.has(segment));
  if (missing.length)
    throw new Error(
      `Research is missing Sales segments: ${missing.join(", ")}`,
    );
}

export async function validateProductSectionFiles(
  catalog: IProductCatalog,
  layerRoot: string,
) {
  async function visit(page: IProductPage): Promise<void> {
    for (const source of [
      page.source,
      page.representations?.text,
      page.representations?.preview,
    ].filter((value): value is string => Boolean(value))) {
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

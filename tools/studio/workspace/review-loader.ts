import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { DocumentLayer } from "./document";
import {
  resolveDocumentReviews,
  workspaceRelativePath,
  workspaceReviewDocuments,
  productReviewPages,
  type IReviewIndexEntry,
} from "./review";

export async function loadDocumentReviews(
  workspaceRoot: string,
  layer: DocumentLayer,
) {
  const indexes = {
    singlepage: parse(
      await readFile(
        path.join(workspaceRoot, "utils/index/singlepage.yaml"),
        "utf8",
      ),
    ) as { entries: IReviewIndexEntry[] },
    startup: parse(
      await readFile(
        path.join(workspaceRoot, "utils/index/startup.yaml"),
        "utf8",
      ),
    ) as { entries: IReviewIndexEntry[] },
  };
  const sources: Record<string, string> = {};
  async function read(sourcePath: string) {
    const relative = workspaceRelativePath(sourcePath);
    const absolute = path.resolve(workspaceRoot, relative);
    if (!absolute.startsWith(path.resolve(workspaceRoot) + path.sep))
      throw new Error(`Review source outside workspace: ${sourcePath}`);
    sources[relative] = await readFile(absolute, "utf8");
  }
  await Promise.all(
    [...indexes.singlepage.entries, ...indexes.startup.entries]
      .filter(
        (entry) =>
          !entry.path.startsWith(".agents/") && /\.(md|yaml)$/.test(entry.path),
      )
      .map(({ path }) => read(path)),
  );
  const baseCatalog = indexes.singlepage.entries.find(
    ({ kind }) => kind === "products",
  );
  const startupCatalog = indexes.startup.entries.find(
    ({ kind }) => kind === "products",
  );
  const startupProducts = startupCatalog
    ? (
        parse(sources[workspaceRelativePath(startupCatalog.path)]) as {
          products?: unknown[];
        } | null
      )?.products
    : undefined;
  const catalogLayer =
    layer === "startup" && startupProducts?.length ? "startup" : "singlepage";
  const entry = catalogLayer === "startup" ? startupCatalog : baseCatalog;
  const catalog = entry
    ? (parse(sources[workspaceRelativePath(entry.path)]) as {
        products?: Array<Record<string, string>>;
        models?: Array<{ source: string }>;
      } | null)
    : undefined;
  await Promise.all(
    (catalog?.products ?? []).flatMap((product) =>
      [
        "analytics",
        "research",
        "sales",
        "product",
        "website",
        "marketing_creative",
        "presentation_data",
        "presentation",
      ]
        .filter((field) => typeof product[field] === "string")
        .map((field) => read(`products/${catalogLayer}/${product[field]}`)),
    ),
  );
  await Promise.all(
    (catalog?.models ?? []).map((model) =>
      read(`products/${catalogLayer}/${model.source}`),
    ),
  );
  await Promise.all(
    (catalog?.products ?? []).flatMap((product) =>
      productReviewPages(product).map((page) =>
        read(`products/${catalogLayer}/${page.source}`),
      ),
    ),
  );
  return resolveDocumentReviews(
    workspaceReviewDocuments({ indexes, sources, layer }),
  );
}

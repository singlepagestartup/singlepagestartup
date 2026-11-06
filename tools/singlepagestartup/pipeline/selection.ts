import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { parseProductCatalog } from "../../../apps/studio/workspace/utils/products/catalog";
import { resolveWorkspaceLayer } from "../../studio/workspace/repository-layer";

export const SECTIONS = [
  "brief",
  "products",
  "competitors",
  "semantics",
  "strategy",
  "brand",
  "design",
  "materials",
] as const;
export type Section = (typeof SECTIONS)[number];
export type Progress = "not_started" | "in_progress" | "prepared" | "skipped";
export const SECTION_STAGES: Record<Section, string> = {
  brief: "00-business",
  products: "05-products",
  competitors: "05-products",
  semantics: "05-products",
  strategy: "10-strategy",
  brand: "20-brand",
  design: "30-design",
  materials: "40-products",
};
const PRODUCT_SECTIONS = new Set<Section>([
  "products",
  "competitors",
  "semantics",
  "materials",
]);
const PROGRESS = new Set(["not_started", "in_progress", "prepared", "skipped"]);
export interface IWorkflowState extends Record<string, unknown> {
  schema: "singlepagestartup.pre-development-state.v2";
  active_stage: string;
  active_section: Section;
  active_product?: string;
  status: Progress;
  progress: Record<string, Progress>;
}
export interface ISelectionOptions {
  section?: string;
  product?: string;
  skip?: boolean;
  complete?: boolean;
  next?: boolean;
}

function section(value: string): Section {
  if (!(SECTIONS as readonly string[]).includes(value))
    throw new Error(`Unknown section ${value}. Choose ${SECTIONS.join(", ")}.`);
  return value as Section;
}
export function progressKey(value: Section, product?: string) {
  return PRODUCT_SECTIONS.has(value) && product ? `${value}:${product}` : value;
}

/** Resume the explicitly selected section. */
export function selectSection(
  raw: Record<string, unknown>,
  products: string[],
  options: ISelectionOptions = {},
): IWorkflowState {
  if ([options.skip, options.complete, options.next].filter(Boolean).length > 1)
    throw new Error("Use only one of --skip, --complete or --next.");
  let active = section(
    options.section ??
      (typeof raw.active_section === "string" ? raw.active_section : "brief"),
  );
  if (options.product && !products.includes(options.product))
    throw new Error(
      `Unknown product ${options.product}. Available: ${products.join(", ") || "none; create a product description first"}.`,
    );
  const product =
    options.product ??
    (typeof raw.active_product === "string" &&
    products.includes(raw.active_product)
      ? raw.active_product
      : products.length === 1
        ? products[0]
        : undefined);
  const progress: Record<string, Progress> = {};
  if (
    raw.progress &&
    typeof raw.progress === "object" &&
    !Array.isArray(raw.progress)
  )
    for (const [key, value] of Object.entries(raw.progress))
      if (PROGRESS.has(String(value))) progress[key] = value as Progress;
  const key = progressKey(active, product);
  if (
    (options.skip || options.complete) &&
    PRODUCT_SECTIONS.has(active) &&
    products.length > 0 &&
    !product
  )
    throw new Error(
      "Choose --product before recording progress for a product section.",
    );
  if (options.skip) progress[key] = "skipped";
  else if (options.complete) progress[key] = "prepared";
  else if (options.section) progress[key] = "in_progress";
  else if (!progress[key])
    progress[key] =
      raw.status === "not_started" ? "not_started" : "in_progress";
  if (options.skip || options.complete || options.next) {
    const following = SECTIONS.slice(SECTIONS.indexOf(active) + 1).find(
      (candidate) => progress[progressKey(candidate, product)] !== "skipped",
    );
    if (following) active = following;
  }
  const activeKey = progressKey(active, product);
  progress[activeKey] ??= "in_progress";
  return {
    schema: "singlepagestartup.pre-development-state.v2",
    active_stage: SECTION_STAGES[active],
    active_section: active,
    ...(product ? { active_product: product } : {}),
    status: progress[activeKey],
    progress,
  };
}

/** Writes only the owning layer's navigation state; no business data or confirmations. */
export function selectWorkspaceSection(
  options: ISelectionOptions & {
    repositoryRoot?: string;
    repositoryIdentity?: string;
  } = {},
) {
  const root = path.resolve(options.repositoryRoot ?? process.cwd());
  const { layer } = resolveWorkspaceLayer({
    repositoryRoot: root,
    repositoryIdentity: options.repositoryIdentity,
    requestedLayer: "auto",
  });
  const catalogPath = path.join(
    root,
    `apps/studio/workspace/products/${layer}/catalog.yaml`,
  );
  const products = existsSync(catalogPath)
    ? parseProductCatalog(
        readFileSync(catalogPath, "utf8"),
        layer,
      ).products.map(({ id }) => id)
    : [];
  const file = path.join(
    root,
    `apps/studio/workspace/utils/pre-development/${layer}.yaml`,
  );
  const raw = existsSync(file) ? parse(readFileSync(file, "utf8")) : {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Workflow state must be a YAML object.");
  const state = selectSection(raw, products, options);
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, stringify(state));
  renameSync(temporary, file);
  return { layer, state, products, file: path.relative(root, file) };
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const values: Record<string, string> = {};
    const flags = new Set<string>();
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (["--skip", "--complete", "--next"].includes(arg)) flags.add(arg);
      else if (["--section", "--product", "--repository-root"].includes(arg)) {
        const value = args[++i];
        if (!value || value.startsWith("--"))
          throw new Error(`${arg} requires a value.`);
        values[arg] = value;
      } else throw new Error(`Unknown option ${arg}.`);
    }
    const result = selectWorkspaceSection({
      section: values["--section"],
      product: values["--product"],
      repositoryRoot: values["--repository-root"],
      skip: flags.has("--skip"),
      complete: flags.has("--complete"),
      next: flags.has("--next"),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}

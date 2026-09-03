import { parse } from "yaml";

export type SalesProcessReadiness = "blocked" | "ready";

export interface ISalesStage {
  action: string;
  entry_conditions: string[];
  exit_condition: string;
  failure: string;
  id: string;
  metric: string;
  name: string;
  owner: string;
  required_fields: string[];
}

export interface ISalesProcess {
  blockers: string[];
  capacity: string;
  owner: string;
  pricing: string;
  product_id: string;
  readiness: SalesProcessReadiness;
  schema: "singlepagestartup.sales-process.v1";
  seller: string;
  stages: ISalesStage[];
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function stringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be an array of strings`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

export function parseSalesProcess(
  source: string,
  expectedProductId?: string,
): ISalesProcess {
  const value = parse(source) as Record<string, unknown> | null;
  if (value?.schema !== "singlepagestartup.sales-process.v1") {
    throw new Error("sales process uses an unsupported schema");
  }
  const productId = requiredString(value.product_id, "sales.product_id");
  if (expectedProductId && productId !== expectedProductId) {
    throw new Error(
      `sales process ${productId} must match portfolio direction ${expectedProductId}`,
    );
  }
  const readiness = value.readiness;
  if (!["blocked", "ready"].includes(String(readiness))) {
    throw new Error(`${productId} sales readiness must be blocked or ready`);
  }
  if (!Array.isArray(value.stages) || value.stages.length === 0) {
    throw new Error(`${productId} sales process needs at least one stage`);
  }
  const ids = new Set<string>();
  const stages = value.stages.map((raw, index) => {
    const stage = raw as Record<string, unknown>;
    const prefix = `${productId}.stages[${index}]`;
    const id = requiredString(stage.id, `${prefix}.id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${prefix}.id must use kebab-case`);
    }
    if (ids.has(id)) throw new Error(`${productId} repeats sales stage ${id}`);
    ids.add(id);
    return {
      action: requiredString(stage.action, `${prefix}.action`),
      entry_conditions: stringList(
        stage.entry_conditions,
        `${prefix}.entry_conditions`,
      ),
      exit_condition: requiredString(
        stage.exit_condition,
        `${prefix}.exit_condition`,
      ),
      failure: requiredString(stage.failure, `${prefix}.failure`),
      id,
      metric: requiredString(stage.metric, `${prefix}.metric`),
      name: requiredString(stage.name, `${prefix}.name`),
      owner: requiredString(stage.owner, `${prefix}.owner`),
      required_fields: stringList(
        stage.required_fields,
        `${prefix}.required_fields`,
      ),
    };
  });
  return {
    blockers: stringList(value.blockers, `${productId}.blockers`),
    capacity: requiredString(value.capacity, `${productId}.capacity`),
    owner: requiredString(value.owner, `${productId}.owner`),
    pricing: requiredString(value.pricing, `${productId}.pricing`),
    product_id: productId,
    readiness: readiness as SalesProcessReadiness,
    schema: "singlepagestartup.sales-process.v1",
    seller: requiredString(value.seller, `${productId}.seller`),
    stages,
  };
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function list(values: string[]): string {
  return values.length ? values.map(cell).join("<br />") : "None";
}

export function salesProcessMarkdown(process: ISalesProcess): string {
  const rows = process.stages
    .map(
      (stage) =>
        `| ${cell(stage.name)} | ${cell(stage.owner)} | ${list(stage.entry_conditions)} | ${list(stage.required_fields)} | ${cell(stage.action)} | ${cell(stage.exit_condition)} | ${cell(stage.failure)} | ${cell(stage.metric)} |`,
    )
    .join("\n");
  const blockers = process.blockers.length
    ? process.blockers.map((blocker) => `- ${blocker}`).join("\n")
    : "- None";
  return `# Sales process

## Control

| Field | Current value |
| --- | --- |
| Readiness | \`${process.readiness}\` |
| Process owner | ${cell(process.owner)} |
| Seller | ${cell(process.seller)} |
| Pricing | ${cell(process.pricing)} |
| Capacity | ${cell(process.capacity)} |

## Stages

| Stage | Owner | Entry conditions | Required fields | Action | Complete when | Failure and fallback | Metric |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Blockers

${blockers}
`;
}

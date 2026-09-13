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

export interface ISalesJourneyStep extends ISalesStage {
  customer_goal: string;
  customer_action: string;
  customer_question: string;
  experience: string;
  touchpoint: string;
}

export interface ISalesAcquisition {
  id: string;
  channel: string;
  context: string;
  message: string;
  cta: string;
  destination: string;
}

export interface ISalesObjection {
  concern: string;
  response: string;
  evidence: string;
}

export interface ISalesSegment {
  id: string;
  name: string;
  audience: string;
  roles: string;
  needs: string[];
  motivations: string[];
  decision_criteria: string[];
  purchase_trigger: string;
  value_proposition: string;
  objections: ISalesObjection[];
  acquisition: ISalesAcquisition[];
  journey: ISalesJourneyStep[];
}

export interface ISalesProcess {
  blockers: string[];
  capacity: string;
  owner: string;
  pricing: string;
  product_id: string;
  readiness: SalesProcessReadiness;
  schema:
    | "singlepagestartup.sales-process.v1"
    | "singlepagestartup.sales-process.v2";
  segments: ISalesSegment[];
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

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${field} must be an object`);
  return value as Record<string, unknown>;
}

function rows(value: unknown, field: string): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value.map((item, index) => record(item, `${field}[${index}]`));
}

function stableId(value: unknown, field: string, ids: Set<string>): string {
  const id = requiredString(value, field);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`${field} must use kebab-case`);
  if (ids.has(id)) throw new Error(`${field} repeats ${id}`);
  ids.add(id);
  return id;
}

function parseStages(value: unknown, field: string): ISalesStage[] {
  const ids = new Set<string>();
  return rows(value, field).map((stage, index) => {
    const prefix = `${field}[${index}]`;
    return {
      id: stableId(stage.id, `${prefix}.id`, ids),
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
      metric: requiredString(stage.metric, `${prefix}.metric`),
      name: requiredString(stage.name, `${prefix}.name`),
      owner: requiredString(stage.owner, `${prefix}.owner`),
      required_fields: stringList(
        stage.required_fields,
        `${prefix}.required_fields`,
      ),
    };
  });
}

function parseSegments(
  value: unknown,
  field: string,
  ready: boolean,
): ISalesSegment[] {
  const ids = new Set<string>();
  return rows(value, field).map((segment, index) => {
    const prefix = `${field}[${index}]`;
    const id = stableId(segment.id, `${prefix}.id`, ids);
    const acquisitionIds = new Set<string>();
    const acquisition = rows(segment.acquisition, `${prefix}.acquisition`).map(
      (item, i) => {
        const path = `${prefix}.acquisition[${i}]`;
        return {
          id: stableId(item.id, `${path}.id`, acquisitionIds),
          channel: requiredString(item.channel, `${path}.channel`),
          context: requiredString(item.context, `${path}.context`),
          message: requiredString(item.message, `${path}.message`),
          cta: requiredString(item.cta, `${path}.cta`),
          destination: requiredString(item.destination, `${path}.destination`),
        };
      },
    );
    const rawJourney = rows(segment.journey, `${prefix}.journey`);
    const journey = parseStages(rawJourney, `${prefix}.journey`).map(
      (step, i) => {
        const raw = rawJourney[i];
        const path = `${prefix}.journey[${i}]`;
        return {
          ...step,
          customer_goal: requiredString(
            raw.customer_goal,
            `${path}.customer_goal`,
          ),
          customer_action: requiredString(
            raw.customer_action,
            `${path}.customer_action`,
          ),
          customer_question: requiredString(
            raw.customer_question,
            `${path}.customer_question`,
          ),
          experience: requiredString(raw.experience, `${path}.experience`),
          touchpoint: requiredString(raw.touchpoint, `${path}.touchpoint`),
        };
      },
    );
    if (ready && (!journey.length || !acquisition.length))
      throw new Error(
        `${prefix} needs acquisition and a customer journey map before it is ready`,
      );
    const needs = stringList(segment.needs, `${prefix}.needs`);
    const motivations = stringList(
      segment.motivations,
      `${prefix}.motivations`,
    );
    const decision_criteria = stringList(
      segment.decision_criteria,
      `${prefix}.decision_criteria`,
    );
    const objections = rows(segment.objections, `${prefix}.objections`).map(
      (item, i) => ({
        concern: requiredString(
          item.concern,
          `${prefix}.objections[${i}].concern`,
        ),
        response: requiredString(
          item.response,
          `${prefix}.objections[${i}].response`,
        ),
        evidence: requiredString(
          item.evidence,
          `${prefix}.objections[${i}].evidence`,
        ),
      }),
    );
    if (
      ready &&
      (!needs.length ||
        !motivations.length ||
        !decision_criteria.length ||
        !objections.length)
    )
      throw new Error(
        `${prefix} needs a complete customer decision profile before it is ready`,
      );
    return {
      id,
      name: requiredString(segment.name, `${prefix}.name`),
      audience: requiredString(segment.audience, `${prefix}.audience`),
      roles: requiredString(segment.roles, `${prefix}.roles`),
      purchase_trigger: requiredString(
        segment.purchase_trigger,
        `${prefix}.purchase_trigger`,
      ),
      value_proposition: requiredString(
        segment.value_proposition,
        `${prefix}.value_proposition`,
      ),
      needs,
      motivations,
      decision_criteria,
      objections,
      acquisition,
      journey,
    };
  });
}

export function parseSalesProcess(
  source: string,
  expectedProductId?: string,
): ISalesProcess {
  const value = record(parse(source), "sales");
  const schema = value.schema;
  if (
    schema !== "singlepagestartup.sales-process.v1" &&
    schema !== "singlepagestartup.sales-process.v2"
  )
    throw new Error("sales process uses an unsupported schema");
  const productId = requiredString(value.product_id, "sales.product_id");
  if (expectedProductId && productId !== expectedProductId)
    throw new Error(
      `sales process ${productId} must match catalog product ${expectedProductId}`,
    );
  const readiness = value.readiness;
  if (readiness !== "blocked" && readiness !== "ready")
    throw new Error(`${productId} sales readiness must be blocked or ready`);
  const blockers = stringList(value.blockers, `${productId}.blockers`);
  if (readiness === "ready" && blockers.length)
    throw new Error(
      `${productId} cannot be ready with unresolved business decisions`,
    );
  if (schema.endsWith(".v2") && value.stages !== undefined)
    throw new Error(
      `${productId} v2 journeys belong to segments, not a second stages list`,
    );
  if (schema.endsWith(".v1") && value.segments !== undefined)
    throw new Error(`${productId} segments require sales-process.v2`);
  const segments = schema.endsWith(".v2")
    ? parseSegments(
        value.segments,
        `${productId}.segments`,
        readiness === "ready",
      )
    : [];
  const stages = schema.endsWith(".v1")
    ? parseStages(value.stages, `${productId}.stages`)
    : [];
  if (
    !(segments.length || stages.length) &&
    !(readiness === "blocked" && blockers.length)
  )
    throw new Error(
      `${productId} sales needs a customer journey, or blocked intake with explicit unknowns`,
    );
  return {
    blockers,
    capacity: requiredString(value.capacity, `${productId}.capacity`),
    owner: requiredString(value.owner, `${productId}.owner`),
    pricing: requiredString(value.pricing, `${productId}.pricing`),
    product_id: productId,
    readiness,
    schema,
    seller: requiredString(value.seller, `${productId}.seller`),
    stages,
    segments,
  };
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

/** Bind every journey to the customer IDs owned by Product, never another offer. */
export function validateSalesSegments(
  process: ISalesProcess,
  productSegmentIds: unknown,
): void {
  if (process.schema.endsWith(".v1")) return;
  const ids = stringList(
    productSegmentIds,
    `${process.product_id}.customer_segments`,
  );
  const unique = new Set<string>();
  for (const id of ids)
    stableId(id, `${process.product_id}.customer_segments`, unique);
  for (const segment of process.segments)
    if (!unique.has(segment.id))
      throw new Error(
        `${process.product_id} Sales segment ${segment.id} is absent from Product customer_segments`,
      );
  if (process.readiness === "ready")
    for (const id of unique)
      if (!process.segments.some((segment) => segment.id === id))
        throw new Error(
          `${process.product_id} Sales is missing customer segment ${id}`,
        );
}

function list(values: string[]): string {
  return values.length ? values.map(cell).join("<br />") : "None";
}

function legacySalesMarkdown(process: ISalesProcess): string {
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

## Process definition

| Field | Definition |
| --- | --- |
| Process completeness | ${process.readiness === "ready" ? "Defined" : "Business decisions needed"} |
| Process owner | ${cell(process.owner)} |
| Seller | ${cell(process.seller)} |
| Pricing | ${cell(process.pricing)} |
| Capacity | ${cell(process.capacity)} |

## Customer journey

| Stage | Owner | Entry conditions | Information needed | Action | Next step reached when | Alternative and continuation | Metric |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Business decisions needed

${blockers}
`;
}

export const journeyRows: { label: string; key: keyof ISalesJourneyStep }[] = [
  { label: "Customer goal", key: "customer_goal" },
  { label: "Customer action", key: "customer_action" },
  { label: "Question before continuing", key: "customer_question" },
  { label: "Desired experience", key: "experience" },
  { label: "Touchpoint", key: "touchpoint" },
  { label: "Our response", key: "action" },
  { label: "Next step", key: "exit_condition" },
  { label: "Relationship / alternative", key: "failure" },
  { label: "Business metric", key: "metric" },
];

export function salesSegmentProfileMarkdown(segment: ISalesSegment): string {
  return `# ${segment.name}

## Customer and situation

${segment.audience}

${segment.roles}

## Needs and pains

${segment.needs.map((item) => `- ${item}`).join("\n")}

## Why they choose

${segment.motivations.map((item) => `- ${item}`).join("\n")}

**Decision trigger:** ${segment.purchase_trigger}

**Value proposition:** ${segment.value_proposition}

## Decision criteria

${segment.decision_criteria.map((item) => `- ${item}`).join("\n")}

## Objections and sales arguments

| Concern | Our response | What to show |
| --- | --- | --- |
${segment.objections.map((item) => `| ${cell(item.concern)} | ${cell(item.response)} | ${cell(item.evidence)} |`).join("\n")}

## Acquisition and message

| Channel | Customer context | Message | Call to action | Destination |
| --- | --- | --- | --- | --- |
${segment.acquisition.map((item) => `| ${cell(item.channel)} | ${cell(item.context)} | ${cell(item.message)} | ${cell(item.cta)} | ${cell(item.destination)} |`).join("\n")}
`;
}

export function salesJourneyMarkdown(segment: ISalesSegment): string {
  if (!segment.journey.length)
    return "## Customer Journey Map (CJM)\n\nThe customer journey has not been defined.";
  return `## Customer Journey Map (CJM)

| Perspective | ${segment.journey.map((step, i) => `${i + 1}. ${cell(step.name)}`).join(" | ")} |
| --- | ${segment.journey.map(() => "---").join(" | ")} |
${journeyRows.map(({ label, key }) => `| ${label} | ${segment.journey.map((step) => cell(String(step[key]))).join(" | ")} |`).join("\n")}

### Responsibilities and handoffs

| Journey point | Owner | Entry conditions | Information needed |
| --- | --- | --- | --- |
${segment.journey.map((step) => `| ${cell(step.name)} | ${cell(step.owner)} | ${list(step.entry_conditions)} | ${list(step.required_fields)} |`).join("\n")}
`;
}

export function salesOverviewMarkdown(process: ISalesProcess): string {
  if (process.schema.endsWith(".v1")) return legacySalesMarkdown(process);
  return `# Sales

## Customer segments

| Segment | Customer and context | Why they choose |
| --- | --- | --- |
${process.segments.map((segment) => `| ${cell(segment.name)} | ${cell(segment.audience)} | ${cell(segment.value_proposition)} |`).join("\n")}

## Commercial model and relationships

| Field | Definition |
| --- | --- |
| Process owner | ${cell(process.owner)} |
| Seller | ${cell(process.seller)} |
| Pricing | ${cell(process.pricing)} |
| Support and capacity | ${cell(process.capacity)} |
${process.blockers.length ? `\n## Business decisions needed\n\n${process.blockers.map((item) => `- ${item}`).join("\n")}\n` : ""}`;
}

export function salesProcessMarkdown(process: ISalesProcess): string {
  return [
    salesOverviewMarkdown(process),
    ...process.segments.map(
      (segment) =>
        `${salesSegmentProfileMarkdown(segment)}\n${salesJourneyMarkdown(segment)}`,
    ),
  ].join("\n");
}

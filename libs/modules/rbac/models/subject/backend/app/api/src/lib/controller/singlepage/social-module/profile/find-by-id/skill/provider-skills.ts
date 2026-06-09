import { ANTHROPIC_API_KEY, OPEN_AI_API_KEY } from "@sps/shared-utils";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { createHash } from "node:crypto";

export const PROVIDER_SKILL_PROVIDERS = ["openai", "anthropic"] as const;

export type ProviderSkillProvider = (typeof PROVIDER_SKILL_PROVIDERS)[number];

export interface IProviderSkillBundle {
  name: string;
  title: string;
  description: string;
  skillMd: string;
  contentHash: string;
}

export interface IProviderSkillReference {
  provider: ProviderSkillProvider;
  providerSkillId: string;
  version?: string | null;
  name: string;
  sourceSkillId: string;
  sourceSkillSlug: string;
  contentHash: string;
  syncedAt: string;
}

export interface IKnowledgeProviderSkillReference {
  provider: ProviderSkillProvider;
  provider_skill_id: string;
  version?: string | null;
  content_hash: string;
  name: string;
  source_skill_id: string;
}

type SkillLike = Pick<
  ISocialModuleSkill,
  "id" | "title" | "description" | "slug" | "metadata"
> & {
  status?: string | null;
};

export function buildProviderSkillBundle(
  skill: SkillLike,
): IProviderSkillBundle {
  const title = toText(skill.title).trim() || toText(skill.slug).trim();
  const name = normalizeSkillName(skill.slug || title || skill.id);
  const instructions = stringifyDescription(skill.description).trim();
  const description = normalizeSkillDescription(
    instructions || title || `Use the ${name} social skill.`,
  );
  const skillMd = [
    "---",
    `name: ${JSON.stringify(name)}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `# ${title || name}`,
    "",
    instructions ||
      "Use this skill as a reusable SPS social.skill instruction.",
    "",
  ].join("\n");

  return {
    name,
    title: title || name,
    description,
    skillMd,
    contentHash: sha256(skillMd),
  };
}

export function isProviderSkillProvider(
  value: unknown,
): value is ProviderSkillProvider {
  return PROVIDER_SKILL_PROVIDERS.includes(value as ProviderSkillProvider);
}

export function parseProviderSkillProviders(
  value: unknown,
): ProviderSkillProvider[] {
  if (!Array.isArray(value) || !value.length) {
    return [...PROVIDER_SKILL_PROVIDERS];
  }

  const providers = value.filter(isProviderSkillProvider);

  if (providers.length !== value.length || !providers.length) {
    throw new Error(
      `Validation error. providers must contain only: ${PROVIDER_SKILL_PROVIDERS.join(", ")}`,
    );
  }

  return Array.from(new Set(providers));
}

export function getProviderSkillReference(props: {
  skill: SkillLike;
  provider: ProviderSkillProvider;
}): IProviderSkillReference | undefined {
  const providerSkills = getProviderSkillsMetadata(props.skill.metadata);
  const reference = providerSkills[props.provider];

  if (!isProviderSkillReference(reference, props.provider)) {
    return undefined;
  }

  return reference;
}

export function isFreshProviderSkillReference(props: {
  skill: SkillLike;
  provider: ProviderSkillProvider;
  bundle?: IProviderSkillBundle;
}) {
  const bundle = props.bundle || buildProviderSkillBundle(props.skill);
  const reference = getProviderSkillReference({
    skill: props.skill,
    provider: props.provider,
  });

  return Boolean(
    reference?.providerSkillId &&
      reference.contentHash === bundle.contentHash &&
      reference.sourceSkillId === props.skill.id,
  );
}

export function toKnowledgeProviderSkillReference(
  reference: IProviderSkillReference,
): IKnowledgeProviderSkillReference {
  return {
    provider: reference.provider,
    provider_skill_id: reference.providerSkillId,
    version: reference.version || undefined,
    content_hash: reference.contentHash,
    name: reference.name,
    source_skill_id: reference.sourceSkillId,
  };
}

export function putProviderSkillReference(props: {
  skill: SkillLike;
  reference: IProviderSkillReference;
}) {
  const metadata = isRecord(props.skill.metadata)
    ? { ...props.skill.metadata }
    : {};
  const providerSkills = {
    ...getProviderSkillsMetadata(metadata),
    [props.reference.provider]: props.reference,
  };

  return {
    ...metadata,
    providerSkills,
  };
}

export async function uploadProviderSkill(props: {
  provider: ProviderSkillProvider;
  bundle: IProviderSkillBundle;
  fetcher?: typeof fetch;
}) {
  if (props.provider === "openai") {
    return uploadOpenAiSkill(props);
  }

  return uploadAnthropicSkill(props);
}

function getProviderSkillsMetadata(metadata: unknown) {
  if (!isRecord(metadata)) {
    return {} as Record<string, unknown>;
  }

  return isRecord(metadata.providerSkills) ? metadata.providerSkills : {};
}

function isProviderSkillReference(
  value: unknown,
  provider: ProviderSkillProvider,
): value is IProviderSkillReference {
  return (
    isRecord(value) &&
    value.provider === provider &&
    typeof value.providerSkillId === "string" &&
    typeof value.sourceSkillId === "string" &&
    typeof value.sourceSkillSlug === "string" &&
    typeof value.contentHash === "string" &&
    typeof value.name === "string"
  );
}

async function uploadOpenAiSkill(props: {
  provider: ProviderSkillProvider;
  bundle: IProviderSkillBundle;
  fetcher?: typeof fetch;
}) {
  const apiKey = OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Configuration error. OPEN_AI_API_KEY or OPENAI_API_KEY is required to sync OpenAI Skills.",
    );
  }

  const fetcher = props.fetcher || fetch;
  const formData = new FormData();

  formData.append(
    "files[]",
    new Blob([props.bundle.skillMd], { type: "text/markdown" }),
    `${props.bundle.name}/SKILL.md`,
  );

  const response = await fetcher("https://api.openai.com/v1/skills", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  return parseProviderSkillUploadResponse({
    response,
    provider: "openai",
    bundle: props.bundle,
  });
}

async function uploadAnthropicSkill(props: {
  provider: ProviderSkillProvider;
  bundle: IProviderSkillBundle;
  fetcher?: typeof fetch;
}) {
  const apiKey = ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Configuration error. ANTHROPIC_API_KEY is required to sync Anthropic Skills.",
    );
  }

  const fetcher = props.fetcher || fetch;
  const formData = new FormData();

  formData.append(
    "files[]",
    new Blob([props.bundle.skillMd], { type: "text/markdown" }),
    `${props.bundle.name}/SKILL.md`,
  );

  const response = await fetcher("https://api.anthropic.com/v1/skills", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta":
        "code-execution-2025-08-25,skills-2025-10-02,files-api-2025-04-14",
    },
    body: formData,
  });

  return parseProviderSkillUploadResponse({
    response,
    provider: "anthropic",
    bundle: props.bundle,
  });
}

async function parseProviderSkillUploadResponse(props: {
  response: Response;
  provider: ProviderSkillProvider;
  bundle: IProviderSkillBundle;
}) {
  const body = await props.response.text();
  const json = tryParseJson(body);

  if (!props.response.ok) {
    throw new Error(
      `${props.provider} Skills API upload failed with status ${props.response.status}. Response: ${body.slice(0, 500)}`,
    );
  }

  const providerSkillId =
    readString(json, ["id"]) ||
    readString(json, ["skill_id"]) ||
    readString(json, ["skill", "id"]) ||
    readString(json, ["data", "id"]);

  if (!providerSkillId) {
    throw new Error(
      `${props.provider} Skills API upload response did not include a skill id.`,
    );
  }

  return {
    providerSkillId,
    version:
      readString(json, ["version"]) ||
      readString(json, ["latest_version"]) ||
      readString(json, ["skill", "version"]) ||
      "latest",
  };
}

function stringifyDescription(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeSkillName(value: unknown) {
  const normalized = toText(value)
    .toLowerCase()
    .replace(/anthropic|claude/g, "ai")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return normalized || "social-skill";
}

function normalizeSkillDescription(value: string) {
  const description = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1024);

  return (
    description ||
    "Use this SPS social skill when its instructions match the task."
  );
}

function readString(value: unknown, path: string[]) {
  let cursor = value;

  for (const key of path) {
    if (!isRecord(cursor)) {
      return undefined;
    }

    cursor = cursor[key];
  }

  return typeof cursor === "string" && cursor.trim()
    ? cursor.trim()
    : undefined;
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

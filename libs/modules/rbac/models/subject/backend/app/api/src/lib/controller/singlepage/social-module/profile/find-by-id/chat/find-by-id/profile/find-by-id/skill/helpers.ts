import { Context } from "hono";
import { Service } from "../../../../../../../../../../service";

export function requireParam(c: Context, name: string) {
  const value = c.req.param(name);

  if (!value) {
    throw new Error(`Validation error. No ${name} provided`);
  }

  return value;
}

export async function parseRequestBody(
  c: Context,
): Promise<Record<string, any>> {
  const json = await c.req.json().catch(() => undefined);

  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, any>;
  }

  const form = await c.req.parseBody();

  if (typeof form.data === "string") {
    return JSON.parse(form.data);
  }

  return {};
}

export function normalizeSkillPayload(value: Record<string, any>) {
  const data = value.data || value;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Validation error. Invalid skill payload");
  }

  const title = toRequiredString(data.title, "title");
  const slug = toRequiredString(data.slug, "slug");
  const description = toString(data.description);
  const status = toSkillStatus(data.status);

  return {
    title,
    slug,
    description,
    status,
  };
}

export async function findProfileSkillIds(props: {
  service: Service;
  targetSocialModuleProfileId: string;
}) {
  const relations = await props.service.socialModule.profilesToSkills.find({
    params: {
      filters: {
        and: [
          {
            column: "profileId",
            method: "eq",
            value: props.targetSocialModuleProfileId,
          },
        ],
      },
      orderBy: {
        and: [
          {
            column: "orderIndex",
            method: "asc",
          },
          {
            column: "createdAt",
            method: "asc",
          },
        ],
      },
    },
  });

  return (
    relations
      ?.map((relation: { skillId?: string }) => relation.skillId)
      .filter((skillId: unknown): skillId is string => {
        return typeof skillId === "string" && Boolean(skillId);
      }) || []
  );
}

function toRequiredString(value: unknown, field: string) {
  const stringValue = toString(value).trim();

  if (!stringValue) {
    throw new Error(`Validation error. Skill ${field} is required`);
  }

  return stringValue;
}

function toString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toSkillStatus(value: unknown) {
  if (value === "draft" || value === "active" || value === "archived") {
    return value;
  }

  return "active";
}

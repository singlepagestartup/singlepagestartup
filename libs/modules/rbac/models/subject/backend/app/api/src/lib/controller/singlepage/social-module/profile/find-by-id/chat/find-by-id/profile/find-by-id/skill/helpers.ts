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

  return {
    title,
    slug,
    description,
  };
}

export async function findProfileSkillIds(props: {
  service: Service;
  targetSocialModuleProfileId: string;
  limit?: number;
  offset?: number;
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
      ...(props.limit === undefined ? {} : { limit: props.limit }),
      ...(props.offset === undefined ? {} : { offset: props.offset }),
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

export function parsePagination(c: Context) {
  const rawLimit = c.req.query("limit");
  const rawOffset = c.req.query("offset");
  const parsedLimit = rawLimit === undefined ? undefined : Number(rawLimit);
  const parsedOffset = rawOffset === undefined ? undefined : Number(rawOffset);

  if (
    parsedLimit !== undefined &&
    (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50)
  ) {
    throw new Error("Validation error. limit must be an integer from 1 to 50");
  }

  if (
    parsedOffset !== undefined &&
    (!Number.isInteger(parsedOffset) || parsedOffset < 0)
  ) {
    throw new Error("Validation error. offset must be a non-negative integer");
  }

  return { limit: parsedLimit, offset: parsedOffset };
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

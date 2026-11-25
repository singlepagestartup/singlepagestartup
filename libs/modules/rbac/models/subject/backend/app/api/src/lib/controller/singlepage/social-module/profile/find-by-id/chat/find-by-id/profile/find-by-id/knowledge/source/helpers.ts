import type { Context } from "hono";
import { z } from "zod";

const sourceDraft = z.object({
  title: z.string().trim().min(1),
  content: z.string(),
  orderIndex: z.number().optional(),
  operationKey: z.uuid().optional(),
  expectedTitle: z.string().optional(),
  expectedContentHash: z.string().optional(),
  removeFileIds: z.array(z.uuid()).optional(),
});

export async function readSourceDraft(c: Context) {
  let data;
  let files: File[] = [];
  if (c.req.header("content-type")?.startsWith("multipart/form-data")) {
    const form = await c.req.formData();
    try {
      data = JSON.parse(String(form.get("data")));
    } catch {
      throw new Error(
        "Validation error. The Knowledge Source draft must be JSON.",
      );
    }
    files = form.getAll("files").filter((file) => typeof file !== "string");
  } else {
    const json = await c.req.json();
    data = json.data ?? json;
  }
  const parsed = sourceDraft.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation error. Invalid Knowledge Source draft.");
  }
  return { ...parsed.data, files };
}
import { Service } from "../../../../../../../../../../../service";

export async function findProfileKnowledgeSourceIds(props: {
  service: Service;
  targetSocialModuleProfileId: string;
  limit?: number;
  offset?: number;
  storeId?: string;
}) {
  const relations =
    await props.service.modules.social.profilesToKnowledgeModuleSources.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.targetSocialModuleProfileId,
            },
            ...(props.storeId
              ? [{ column: "variant", method: "eq" as const, value: "default" }]
              : []),
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
        ...(props.limit === undefined || props.storeId
          ? {}
          : { limit: props.limit }),
        ...(props.offset === undefined || props.storeId
          ? {}
          : { offset: props.offset }),
      },
    });

  let visible = relations;
  if (props.storeId) {
    visible = relations.filter(
      ({ storeId, offerId, projectId }) =>
        (!storeId || storeId === props.storeId) && !offerId && !projectId,
    );
  }
  return (visible ?? [])
    .map(({ knowledgeModuleSourceId }) => knowledgeModuleSourceId)
    .filter(
      (sourceId): sourceId is string =>
        typeof sourceId === "string" && Boolean(sourceId),
    );
}

export function toText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function toMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function toOrderIndex(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.floor(numberValue);
}

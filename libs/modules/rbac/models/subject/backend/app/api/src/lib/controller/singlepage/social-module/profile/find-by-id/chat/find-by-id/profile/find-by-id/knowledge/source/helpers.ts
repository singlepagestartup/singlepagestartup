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

  return (
    relations
      ?.map((relation: { knowledgeModuleSourceId?: string }) => {
        return relation.knowledgeModuleSourceId;
      })
      .filter((sourceId: unknown): sourceId is string => {
        return typeof sourceId === "string" && Boolean(sourceId);
      }) || []
  );
  if (props.storeId) {
    const relevant = relations.filter(
      ({ storeId, offerId, projectId }) =>
        (!storeId || storeId === props.storeId) && !offerId && !projectId,
    );
    return relevant.map(
      ({ knowledgeModuleSourceId }) => knowledgeModuleSourceId,
    );
  }
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

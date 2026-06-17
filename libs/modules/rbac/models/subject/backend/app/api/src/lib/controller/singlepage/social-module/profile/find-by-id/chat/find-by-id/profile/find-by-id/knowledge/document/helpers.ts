import { Service } from "../../../../../../../../../../../service";

export async function findProfileKnowledgeDocumentIds(props: {
  service: Service;
  targetSocialModuleProfileId: string;
}) {
  const relations =
    await props.service.socialModule.profilesToKnowledgeModuleDocuments.find({
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
      ?.map((relation: { knowledgeModuleDocumentId?: string }) => {
        return relation.knowledgeModuleDocumentId;
      })
      .filter((documentId: unknown): documentId is string => {
        return typeof documentId === "string" && Boolean(documentId);
      }) || []
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

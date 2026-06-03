import { Context } from "hono";
import { Service } from "../../../../../../../service";

export function requireParam(c: Context, name: string) {
  const value = c.req.param(name);

  if (!value) {
    throw new Error(`Validation error. No ${name} provided`);
  }

  return value;
}

export async function findProfileKnowledgeDocumentRelations(props: {
  service: Service;
  socialModuleProfileId: string;
}) {
  return props.service.socialModule.profilesToKnowledgeModuleDocuments.find({
    params: {
      filters: {
        and: [
          {
            column: "profileId",
            method: "eq",
            value: props.socialModuleProfileId,
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
}

export async function resolveKnowledgeDocumentProfileId(props: {
  service: Service;
  socialModuleProfileId: string;
  targetSocialModuleProfileId?: string;
  socialModuleChatId?: string;
}) {
  const targetSocialModuleProfileId =
    props.targetSocialModuleProfileId?.trim() || props.socialModuleProfileId;

  if (targetSocialModuleProfileId === props.socialModuleProfileId) {
    return targetSocialModuleProfileId;
  }

  if (!props.socialModuleChatId) {
    throw new Error(
      "Validation error. socialModuleChatId is required for target profile Knowledge document access",
    );
  }

  const [requestingProfileToChat, targetProfileToChat] = await Promise.all([
    props.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    }),
    props.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: targetSocialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    }),
  ]);

  if (!requestingProfileToChat?.length) {
    throw new Error(
      "Authorization error. Requesting social-module profile is not connected to chat",
    );
  }

  if (!targetProfileToChat?.length) {
    throw new Error(
      "Authorization error. Target social-module profile is not connected to chat",
    );
  }

  return targetSocialModuleProfileId;
}

export function getKnowledgeDocumentIds(relations: unknown[]) {
  return relations
    .map((relation) => {
      return (relation as { knowledgeModuleDocumentId?: unknown })
        .knowledgeModuleDocumentId;
    })
    .filter((documentId): documentId is string => {
      return typeof documentId === "string" && Boolean(documentId);
    });
}

export async function assertProfileKnowledgeDocumentAccess(props: {
  service: Service;
  socialModuleProfileId: string;
  knowledgeModuleDocumentId: string;
  targetSocialModuleProfileId?: string;
  socialModuleChatId?: string;
}) {
  const documentProfileId = await resolveKnowledgeDocumentProfileId({
    service: props.service,
    socialModuleProfileId: props.socialModuleProfileId,
    targetSocialModuleProfileId: props.targetSocialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
  });
  const relations =
    await props.service.socialModule.profilesToKnowledgeModuleDocuments.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: documentProfileId,
            },
            {
              column: "knowledgeModuleDocumentId",
              method: "eq",
              value: props.knowledgeModuleDocumentId,
            },
          ],
        },
        limit: 1,
      },
    });

  if (!relations?.length) {
    throw new Error(
      "Authorization error. Requested Knowledge document is not linked to profile",
    );
  }

  return relations[0];
}

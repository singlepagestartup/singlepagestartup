import { Context } from "hono";
import { Service } from "../../../../../../../service";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model";

export function requireParam(c: Context, name: string) {
  const value = c.req.param(name);

  if (!value) {
    throw new Error(`Validation error. No ${name} provided`);
  }

  return value;
}

export async function findProfileKnowledgeSourceRelations(props: {
  service: Service;
  socialModuleProfileId: string;
  includeCustomerMemory?: boolean;
}) {
  return props.service.modules.social.profilesToKnowledgeModuleSources.find({
    params: {
      filters: {
        and: [
          {
            column: "profileId",
            method: "eq",
            value: props.socialModuleProfileId,
          },
          ...(props.includeCustomerMemory
            ? []
            : [
                {
                  column: "variant",
                  method: "ne" as const,
                  value: "customer-memory",
                },
              ]),
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

interface IKnowledgeSourceScopeInput {
  service: Service;
  subjectId: string;
  socialModuleProfileId: string;
  targetSocialModuleProfileId?: string;
  socialModuleChatId?: string;
}

export async function resolveKnowledgeSourceScope(
  props: IKnowledgeSourceScopeInput,
): Promise<{ profileId: string; storeId?: string }> {
  const targetSocialModuleProfileId =
    props.targetSocialModuleProfileId?.trim() || props.socialModuleProfileId;

  if (targetSocialModuleProfileId === props.socialModuleProfileId) {
    return { profileId: targetSocialModuleProfileId };
  }

  if (!props.socialModuleChatId) {
    throw new Error(
      "Validation error. socialModuleChatId is required for target profile Knowledge Source access",
    );
  }

  const chat = await props.service.modules.social.chat.findById({
    id: props.socialModuleChatId,
  });
  if (chat?.variant === STORE_EMPLOYEE_CHAT_VARIANT) {
    const scope = await props.service.crmWorkspace.employees.scopeForChat(
      props.subjectId,
      chat,
    );
    if (
      scope.profileId !== targetSocialModuleProfileId ||
      scope.actorProfileId !== props.socialModuleProfileId
    ) {
      throw new Error(
        "Not Found error. Employee knowledge profile is unavailable",
      );
    }
    return { profileId: scope.profileId, storeId: scope.storeId };
  }

  const [requestingProfileToChat, targetProfileToChat] = await Promise.all([
    props.service.modules.social.profilesToChats.find({
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
    props.service.modules.social.profilesToChats.find({
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

  if (
    !requestingProfileToChat?.length &&
    !(await props.service.socialModuleChatLifecycleIsSubjectAdmin({
      subjectId: props.subjectId,
    }))
  ) {
    throw new Error(
      "Permission error. Requesting social-module profile is not connected to chat",
    );
  }

  if (!targetProfileToChat?.length) {
    throw new Error(
      "Permission error. Target social-module profile is not connected to chat",
    );
  }

  const owners = await props.service.module.subjectsToSocialModuleProfiles.find(
    {
      params: {
        filters: {
          and: [
            {
              column: "socialModuleProfileId",
              method: "eq",
              value: targetSocialModuleProfileId,
            },
          ],
        },
      },
    },
  );
  if (owners.length) {
    const employees =
      await props.service.module.subjectsToEcommerceModuleStores.find({
        params: {
          limit: 1,
          filters: {
            and: [
              {
                column: "subjectId",
                method: "inArray",
                value: owners.map(({ subjectId }) => subjectId),
              },
              { column: "variant", method: "eq", value: "crm-agent" },
            ],
          },
        },
      });
    if (employees.length) {
      throw new Error(
        "Not Found error. Employee knowledge profile is unavailable",
      );
    }
  }
  return { profileId: targetSocialModuleProfileId };
}

export function getKnowledgeSourceIds(relations: unknown[]) {
  return relations
    .map((relation) => {
      return (relation as { knowledgeModuleSourceId?: unknown })
        .knowledgeModuleSourceId;
    })
    .filter((sourceId): sourceId is string => {
      return typeof sourceId === "string" && Boolean(sourceId);
    });
}

export async function assertProfileKnowledgeSourceAccess(props: {
  service: Service;
  subjectId: string;
  socialModuleProfileId: string;
  knowledgeModuleSourceId: string;
  targetSocialModuleProfileId?: string;
  socialModuleChatId?: string;
}) {
  const scope = await resolveKnowledgeSourceScope({
    service: props.service,
    subjectId: props.subjectId,
    socialModuleProfileId: props.socialModuleProfileId,
    targetSocialModuleProfileId: props.targetSocialModuleProfileId,
    socialModuleChatId: props.socialModuleChatId,
  });
  const relations =
    await props.service.modules.social.profilesToKnowledgeModuleSources.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: scope.profileId,
            },
            {
              column: "knowledgeModuleSourceId",
              method: "eq",
              value: props.knowledgeModuleSourceId,
            },
            { column: "variant", method: "ne", value: "customer-memory" },
          ],
        },
        limit: 1,
      },
    });

  if (!relations?.length) {
    throw new Error(
      "Authorization error. Requested Knowledge Source is not linked to profile",
    );
  }
  const source = await props.service.modules.knowledge.source.findById({
    id: props.knowledgeModuleSourceId,
  });
  if (!source || source.variant === "customer-memory") {
    throw new Error("Not Found error. Knowledge Source is unavailable");
  }

  if (scope.storeId) {
    const [relation] = relations;
    const sourceLinks =
      await props.service.modules.social.profilesToKnowledgeModuleSources.find({
        params: {
          limit: 2,
          filters: {
            and: [
              {
                column: "knowledgeModuleSourceId",
                method: "eq",
                value: props.knowledgeModuleSourceId,
              },
            ],
          },
        },
      });
    if (
      source?.variant !== "default" ||
      sourceLinks.length !== 1 ||
      relation.variant !== "default" ||
      (relation.storeId && relation.storeId !== scope.storeId) ||
      relation.offerId ||
      relation.projectId
    ) {
      throw new Error(
        "Not Found error. Employee knowledge source is unavailable",
      );
    }
  }

  return relations[0];
}

import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import {
  DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
  KnowledgeGenerationModelSlug,
} from "@sps/knowledge/sdk/model";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";

interface IRequestData {
  shouldReplySocialModuleProfile?: Partial<ISocialModuleProfile> & {
    id?: string;
  };
  generationModelSlug?: KnowledgeGenerationModelSlug;
  topK?: number;
  minSimilarity?: number;
  skillIds?: string[];
  useKnowledgeSearch?: boolean;
}

interface ILearnContentItem {
  content: string;
  title: string;
  fileId?: string | null;
  fileName?: string | null;
  filePath?: string | null;
}

interface IResolvedKnowledgeSkills {
  requestedSkillIds: string[];
  skillsProfileId: string;
  promptSkills: ISocialModuleSkill[];
}

interface IKnowledgeChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new KnowledgeService();
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const subjectId = this.requireParam(c, "id");
      const socialModuleProfileId = this.requireParam(
        c,
        "socialModuleProfileId",
      );
      const socialModuleChatId = this.requireParam(c, "socialModuleChatId");
      const socialModuleMessageId = this.requireParam(
        c,
        "socialModuleMessageId",
      );
      const data = await this.parseData(c);

      await this.assertProfileCanAccessChat({
        subjectId,
        socialModuleProfileId,
        socialModuleChatId,
      });
      await this.assertProfileCanAccessMessage({
        socialModuleProfileId,
        socialModuleMessageId,
      });
      await this.assertMessageBelongsToChat({
        socialModuleChatId,
        socialModuleMessageId,
      });

      const [socialModuleChat, socialModuleMessage, replyProfile] =
        await Promise.all([
          this.service.socialModule.chat.findById({
            id: socialModuleChatId,
          }),
          this.service.socialModule.message.findById({
            id: socialModuleMessageId,
          }),
          this.loadReplyProfile(data),
        ]);

      this.assertKnowledgeChat(socialModuleChat);
      this.assertReplyProfile(replyProfile);
      await this.assertReplyProfileConnectedToChat({
        socialModuleProfileId: replyProfile.id,
        socialModuleChatId,
      });

      const socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
        socialModuleChatId,
        socialModuleMessageId,
      });

      if (this.hasLearnCommand(socialModuleMessage)) {
        this.assertLearnCommandHasKnowledgeMention(socialModuleMessage);
        const result = await this.learnFromMessage({
          data,
          replyProfile,
          socialModuleChatId,
          socialModuleThreadId,
          socialModuleMessage,
          sourceSocialModuleProfileId: socialModuleProfileId,
        });

        return c.json({ data: result });
      }

      const result = await this.answerFromKnowledge({
        data,
        replyProfile,
        socialModuleChatId,
        socialModuleThreadId,
        socialModuleMessage,
      });

      return c.json({ data: result });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private requireParam(c: Context, name: string) {
    const value = c.req.param(name);

    if (!value) {
      throw new Error(`Validation error. No ${name} provided`);
    }

    return value;
  }

  private async parseData(c: Context): Promise<IRequestData> {
    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      throw new Error(
        "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
          typeof body["data"],
      );
    }

    try {
      return JSON.parse(body["data"]);
    } catch (error) {
      throw new Error(
        "Validation error. Invalid JSON in body['data']. Got: " + body["data"],
      );
    }
  }

  private async loadReplyProfile(
    data: IRequestData,
  ): Promise<ISocialModuleProfile | undefined> {
    const replyProfileId = data.shouldReplySocialModuleProfile?.id;

    if (!replyProfileId) {
      throw new Error(
        "Validation error. 'data.shouldReplySocialModuleProfile' not passed.",
      );
    }

    return this.service.socialModule.profile.findById({
      id: replyProfileId,
    });
  }

  private assertKnowledgeChat(socialModuleChat: ISocialModuleChat | undefined) {
    if (!socialModuleChat) {
      throw new Error(
        "Not found error. Requested social-module chat not found",
      );
    }

    if (socialModuleChat.variant !== "knowledge") {
      throw new Error(
        'Validation error. Knowledge reactions require chat.variant="knowledge".',
      );
    }
  }

  private assertReplyProfile(
    replyProfile: ISocialModuleProfile | undefined,
  ): asserts replyProfile is ISocialModuleProfile {
    if (!replyProfile) {
      throw new Error("Not found error. Reply social-module profile not found");
    }

    if (replyProfile.variant !== "artificial-intelligence") {
      throw new Error(
        'Validation error. Knowledge reactions require reply profile variant="artificial-intelligence".',
      );
    }
  }

  private async assertProfileCanAccessChat(props: {
    subjectId: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
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
        },
      });

    if (socialModuleProfilesToChats?.length) {
      return;
    }

    if (await this.isSubjectAdmin(props.subjectId)) {
      return;
    }

    throw new Error(
      "Authorization error. Requested social-module chat does not belong to profile",
    );
  }

  private async assertProfileCanAccessMessage(props: {
    socialModuleProfileId: string;
    socialModuleMessageId: string;
  }) {
    const socialModuleProfilesToMessages =
      await this.service.socialModule.profilesToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!socialModuleProfilesToMessages?.length) {
      throw new Error(
        "Authorization error. Requested social-module message does not belong to profile",
      );
    }
  }

  private async assertMessageBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }) {
    const socialModuleChatsToMessages =
      await this.service.socialModule.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!socialModuleChatsToMessages?.length) {
      throw new Error(
        "Validation error. Requested social-module message does not belong to chat",
      );
    }
  }

  private async assertReplyProfileConnectedToChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const socialModuleProfilesToChats =
      await this.service.socialModule.profilesToChats.find({
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
      });

    if (!socialModuleProfilesToChats?.length) {
      throw new Error(
        "Authorization error. Reply social-module profile is not connected to chat",
      );
    }
  }

  private async findKnowledgeDocumentIdsForProfile(
    socialModuleProfileId: string,
  ) {
    const relations =
      await this.service.socialModule.profilesToKnowledgeModuleDocuments.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: socialModuleProfileId,
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

  private async ensureProfileKnowledgeDocumentRelation(props: {
    socialModuleProfileId: string;
    knowledgeModuleDocumentId: string;
  }) {
    const existing =
      await this.service.socialModule.profilesToKnowledgeModuleDocuments.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
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

    if (existing?.length) {
      return existing[0];
    }

    return this.service.socialModule.profilesToKnowledgeModuleDocuments.create({
      data: {
        profileId: props.socialModuleProfileId,
        knowledgeModuleDocumentId: props.knowledgeModuleDocumentId,
      },
    });
  }

  private async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectsToRoles = await this.service.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
      },
    });
    const roleIds =
      subjectsToRoles
        ?.map((subjectToRole) => subjectToRole.roleId)
        .filter((roleId): roleId is string => Boolean(roleId)) || [];

    if (!roleIds.length) {
      return false;
    }

    const roles = await this.service.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: roleIds,
            },
          ],
        },
      },
    });

    return Boolean(roles?.find((role) => role.slug === "admin"));
  }

  private isLearnMessage(
    socialModuleMessage: ISocialModuleMessage | undefined,
  ) {
    return Boolean(
      socialModuleMessage?.description &&
        this.hasKnowledgeMention(socialModuleMessage.description) &&
        this.hasLearnCommand(socialModuleMessage),
    );
  }

  private hasLearnCommand(
    socialModuleMessage: ISocialModuleMessage | undefined,
  ) {
    return Boolean(
      socialModuleMessage?.description &&
        this.stripSkillMentions(socialModuleMessage.description).match(
          /^\/learn\b/i,
        ),
    );
  }

  private assertLearnCommandHasKnowledgeMention(
    socialModuleMessage: ISocialModuleMessage | undefined,
  ) {
    if (this.isLearnMessage(socialModuleMessage)) {
      return;
    }

    throw new Error(
      "Validation error. /learn requires @knowledge mention. Use @knowledge /learn ...",
    );
  }

  private async learnFromMessage(props: {
    data: IRequestData;
    replyProfile: ISocialModuleProfile;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    socialModuleMessage: ISocialModuleMessage | undefined;
    sourceSocialModuleProfileId: string;
  }) {
    if (!props.socialModuleMessage) {
      throw new Error(
        "Not found error. Requested social-module message not found",
      );
    }

    const contentItems = await this.collectLearnContentItems({
      socialModuleMessage: props.socialModuleMessage,
    });

    if (!contentItems.length) {
      throw new Error(
        "Validation error. /learn requires message text or .txt/.md/.markdown attachments.",
      );
    }

    const learned: Awaited<ReturnType<KnowledgeService["learnContent"]>>[] = [];

    for (const [index, item] of contentItems.entries()) {
      const content = this.toLearnText(item.content).trim();

      if (!content) {
        continue;
      }

      try {
        const contentHash = this.sha256(content);
        const slug = this.toSlug(
          [
            "knowledge",
            props.replyProfile.id,
            props.socialModuleMessage.id,
            item.fileId || "message",
            contentHash.slice(0, 16),
          ].join("-"),
        );
        learned.push(
          await this.knowledgeService.learnContent({
            slug,
            title: this.toLearnText(item.title),
            content,
            summary: "Content learned from social chat message",
            metadata: {
              sourceKind: "chat-message",
              sourceSystem: "social-chat-learn",
              assistantSocialModuleProfileId: props.replyProfile.id,
              socialModuleChatId: props.socialModuleChatId,
              socialModuleThreadId: props.socialModuleThreadId,
              socialModuleMessageId: props.socialModuleMessage.id,
              fileId: item.fileId || null,
              fileName: this.toLearnText(item.fileName) || null,
              filePath: this.toLearnText(item.filePath) || null,
              contentHash,
              sourceSocialModuleProfileId: props.sourceSocialModuleProfileId,
              triggerMessageId: props.socialModuleMessage.id,
              learnItemIndex: index,
            },
          }),
        );
        await this.ensureProfileKnowledgeDocumentRelation({
          socialModuleProfileId: props.replyProfile.id,
          knowledgeModuleDocumentId: learned[learned.length - 1].document.id,
        });
      } catch (error) {
        throw new Error(
          `Knowledge learn failed for item ${index + 1}/${contentItems.length}${
            item.fileId ? ` fileId=${item.fileId}` : ""
          }: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const content =
      learned.length === 1
        ? "Learned 1 knowledge item."
        : `Learned ${learned.length} knowledge items.`;

    return this.createThreadMessage({
      profileId: props.replyProfile.id,
      chatId: props.socialModuleChatId,
      threadId: props.socialModuleThreadId,
      role: "assistant",
      content,
      metadata: {
        knowledge: {
          action: "learn",
          profileId: props.replyProfile.id,
          triggerMessageId: props.socialModuleMessage.id,
          documents: learned.map((entry) => {
            return {
              id: entry.document.id,
              slug: entry.document.slug,
              title: entry.document.title,
            };
          }),
          indexes: learned.map((entry) => entry.index),
        },
      },
    });
  }

  private async answerFromKnowledge(props: {
    data: IRequestData;
    replyProfile: ISocialModuleProfile;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    socialModuleMessage: ISocialModuleMessage | undefined;
  }) {
    const requestedSkillIds = this.normalizeSkillIds(props.data.skillIds);
    const rawQuery = props.socialModuleMessage?.description || "";
    const requestedKnowledgeSearch =
      props.data.useKnowledgeSearch === true ||
      this.hasKnowledgeMention(rawQuery);
    const query =
      requestedSkillIds.length || requestedKnowledgeSearch
        ? this.stripSkillMentions(rawQuery)
        : rawQuery.trim();

    if (!props.socialModuleMessage || !query) {
      throw new Error(
        "Validation error. Knowledge question message description is required.",
      );
    }

    const knowledgeDocumentIds = await this.findKnowledgeDocumentIdsForProfile(
      props.replyProfile.id,
    );
    const chatHistory = await this.findThreadChatHistory({
      socialModuleThreadId: props.socialModuleThreadId,
      triggerMessageId: props.socialModuleMessage.id,
    });
    const generationModelSlug =
      props.data.generationModelSlug || DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG;
    const resolvedSkills = await this.resolveKnowledgeSkills({
      replySocialModuleProfileId: props.replyProfile.id,
      requestedSkillIds,
    });
    const useKnowledgeSearch = this.shouldUseKnowledgeSearch({
      query,
      requestedKnowledgeSearch,
      requestedSkillIds,
      chatHistory,
    });
    const searchDocumentIds = useKnowledgeSearch ? knowledgeDocumentIds : [];
    const generation = await this.knowledgeService.generate({
      query,
      topK: props.data.topK,
      minSimilarity: props.data.minSimilarity,
      generationModelSlug,
      documentIds: searchDocumentIds,
      persona: {
        title: props.replyProfile.adminTitle || props.replyProfile.slug,
        description: props.replyProfile.description,
      },
      chatHistory,
      skillInstructions: this.toPromptSkillInstructions(
        resolvedSkills.promptSkills,
      ),
      useKnowledgeSearch,
    });

    return this.createThreadMessage({
      profileId: props.replyProfile.id,
      chatId: props.socialModuleChatId,
      threadId: props.socialModuleThreadId,
      role: "assistant",
      content: generation.answer,
      metadata: {
        knowledge: {
          action: "generate",
          profileId: props.replyProfile.id,
          documentIds: searchDocumentIds,
          triggerMessageId: props.socialModuleMessage.id,
          useKnowledgeSearch,
          citations: generation.sources,
          sources: generation.sources,
          generationModelSlug: generation.generationModelSlug,
          generationProvider: generation.generationProvider,
          generationModel: generation.generationModel,
          usage: generation.usage,
          ...(requestedSkillIds.length
            ? {
                requestedSkillIds,
                skillsProfileId: resolvedSkills.skillsProfileId,
              }
            : {}),
          ...(requestedKnowledgeSearch
            ? {
                requestedKnowledgeSearch: true,
              }
            : {}),
          skills: this.toAppliedKnowledgeSkillMetadata(resolvedSkills),
        },
      },
    });
  }

  private async resolveKnowledgeSkills(props: {
    replySocialModuleProfileId: string;
    requestedSkillIds: string[];
  }): Promise<IResolvedKnowledgeSkills> {
    const skillsProfileId = props.replySocialModuleProfileId;

    if (props.requestedSkillIds.length) {
      return {
        requestedSkillIds: props.requestedSkillIds,
        skillsProfileId,
        promptSkills: await this.findPromptSkillsForProfile({
          socialModuleProfileId: skillsProfileId,
          skillIds: props.requestedSkillIds,
        }),
      };
    }

    return {
      requestedSkillIds: [],
      skillsProfileId,
      promptSkills: [],
    };
  }

  private async findThreadChatHistory(props: {
    socialModuleThreadId: string;
    triggerMessageId: string;
  }): Promise<IKnowledgeChatHistoryMessage[]> {
    const relations = await this.service.socialModule.threadsToMessages.find({
      params: {
        filters: {
          and: [
            {
              column: "threadId",
              method: "eq",
              value: props.socialModuleThreadId,
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
    const orderedMessageIds =
      relations
        ?.map((relation: { messageId?: string }) => relation.messageId)
        .filter((messageId: unknown): messageId is string => {
          return typeof messageId === "string" && Boolean(messageId);
        }) || [];
    const triggerIndex = orderedMessageIds.indexOf(props.triggerMessageId);
    const historyMessageIds =
      triggerIndex >= 0
        ? orderedMessageIds.slice(0, triggerIndex)
        : orderedMessageIds.filter((id) => id !== props.triggerMessageId);

    if (!historyMessageIds.length) {
      return [];
    }

    const messages = await this.service.socialModule.message.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: historyMessageIds,
            },
          ],
        },
      },
    });
    const messagesById = new Map(
      (messages || []).map((message: ISocialModuleMessage) => [
        message.id,
        message,
      ]),
    );

    return historyMessageIds
      .map((messageId) => messagesById.get(messageId))
      .filter((message): message is ISocialModuleMessage => Boolean(message))
      .map((message) => this.toChatHistoryMessage(message))
      .filter((message) => Boolean(message.content.trim()));
  }

  private toChatHistoryMessage(
    message: ISocialModuleMessage,
  ): IKnowledgeChatHistoryMessage {
    return {
      role: this.getMessageInteractionRole(message),
      content: this.toLearnText(
        this.getMessageInteractionContent(message) || message.description || "",
      ),
    };
  }

  private getMessageInteractionRole(
    message: ISocialModuleMessage,
  ): "user" | "assistant" {
    const interaction = message.interaction;

    if (
      interaction &&
      typeof interaction === "object" &&
      "role" in interaction &&
      interaction.role === "assistant"
    ) {
      return "assistant";
    }

    return "user";
  }

  private getMessageInteractionContent(message: ISocialModuleMessage) {
    const interaction = message.interaction;

    if (
      interaction &&
      typeof interaction === "object" &&
      "content" in interaction &&
      typeof interaction.content === "string"
    ) {
      return interaction.content;
    }

    return "";
  }

  private shouldUseKnowledgeSearch(props: {
    query: string;
    requestedKnowledgeSearch: boolean;
    requestedSkillIds: string[];
    chatHistory: IKnowledgeChatHistoryMessage[];
  }) {
    return props.requestedKnowledgeSearch;
  }

  private hasKnowledgeMention(value: string) {
    return /(^|\s)@knowledge(?=\s|$)/i.test(value);
  }

  private toPromptSkillInstructions(skills: ISocialModuleSkill[]) {
    return skills.map((skill) => {
      return {
        id: skill.id,
        slug: skill.slug,
        title: skill.title || skill.adminTitle || skill.slug,
        instructions: skill.description,
      };
    });
  }

  private toAppliedKnowledgeSkillMetadata(skills: IResolvedKnowledgeSkills) {
    return skills.promptSkills.map((skill) => {
      return {
        skillId: skill.id,
        slug: skill.slug,
        title: skill.title || skill.adminTitle || skill.slug,
        mode: "prompt-instruction",
      };
    });
  }

  private async findPromptSkillsForProfile(props: {
    socialModuleProfileId: string;
    skillIds: string[];
  }) {
    return this.findActiveSkillsForProfile({
      socialModuleProfileId: props.socialModuleProfileId,
      skillIds: props.skillIds,
      requireRequestedSkillsLinked: true,
    });
  }

  private async findActiveSkillsForProfile(props: {
    socialModuleProfileId: string;
    skillIds?: string[];
    requireRequestedSkillsLinked: boolean;
  }) {
    const relations = await this.service.socialModule.profilesToSkills.find({
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
    const linkedSkillIds =
      relations
        ?.map((relation: { skillId?: string }) => relation.skillId)
        .filter((skillId: unknown): skillId is string => {
          return typeof skillId === "string" && Boolean(skillId);
        }) || [];
    const requestedSkillIds = this.normalizeSkillIds(props.skillIds);
    const skillIds = requestedSkillIds.length
      ? requestedSkillIds
      : linkedSkillIds;

    if (!skillIds.length) {
      return [];
    }

    if (props.requireRequestedSkillsLinked && requestedSkillIds.length) {
      const linkedSkillIdSet = new Set(linkedSkillIds);
      const unlinkedSkillIds = requestedSkillIds.filter((skillId) => {
        return !linkedSkillIdSet.has(skillId);
      });

      if (unlinkedSkillIds.length) {
        throw new Error(
          `Authorization error. Selected social skills are not linked to profile ${props.socialModuleProfileId}: ${unlinkedSkillIds.join(", ")}`,
        );
      }
    }

    const skills = await this.service.socialModule.skill.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: skillIds,
            },
          ],
        },
      },
    });
    const skillsById = new Map(
      (skills || []).map((skill: ISocialModuleSkill) => [skill.id, skill]),
    );
    const activeSkills = skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is ISocialModuleSkill => {
        return Boolean(skill && skill.status !== "archived");
      });

    if (!activeSkills.length) {
      return [];
    }

    return activeSkills;
  }

  private async collectLearnContentItems(props: {
    socialModuleMessage: ISocialModuleMessage;
  }): Promise<ILearnContentItem[]> {
    const items: ILearnContentItem[] = [];
    const strippedMessage = this.stripLearnPrefix(
      props.socialModuleMessage.description || "",
    );

    if (strippedMessage) {
      items.push({
        content: this.toLearnText(strippedMessage),
        title: this.toTitle(strippedMessage),
      });
    }

    const socialModuleMessagesToFileStorageModuleFiles =
      await this.service.socialModule.messagesToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessage.id,
              },
            ],
          },
          orderBy: {
            and: [
              {
                column: "orderIndex",
                method: "asc",
              },
            ],
          },
        },
      });
    const fileIds =
      socialModuleMessagesToFileStorageModuleFiles
        ?.map((relation) => relation.fileStorageModuleFileId)
        .filter((fileId): fileId is string => Boolean(fileId)) || [];

    if (!fileIds.length) {
      return items;
    }

    const files = await this.service.fileStorageModule.file.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: fileIds,
            },
          ],
        },
      },
    });

    for (const file of files || []) {
      if (!this.isSupportedLearnAttachment(file)) {
        continue;
      }

      const content = this.toLearnText(
        await this.readFileStorageModuleFile(file),
      );
      const filePath = this.toLearnText(file.file);
      const fileName =
        this.toLearnText(file.adminTitle) || basename(filePath) || "Attachment";

      if (!content.trim()) {
        continue;
      }

      items.push({
        content,
        title: fileName,
        fileId: file.id,
        fileName,
        filePath,
      });
    }

    return items;
  }

  private stripLearnPrefix(value: string) {
    return this.stripSkillMentions(value)
      .replace(/^\/learn\b/i, "")
      .trim();
  }

  private stripSkillMentions(value: string) {
    return this.toLearnText(value)
      .replace(/(^|\s)@[a-zA-Z0-9._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSkillIds(value?: string[]) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((skillId) => {
            return typeof skillId === "string" ? skillId.trim() : "";
          })
          .filter((skillId): skillId is string => {
            return Boolean(skillId);
          }),
      ),
    );
  }

  private isSupportedLearnAttachment(file: IFileStorageModuleFile) {
    const filePath = this.toLearnText(file.file);
    const extension = (
      this.toLearnText(file.extension) ||
      extname(filePath.split("?")[0]).replace(".", "")
    ).toLowerCase();

    return ["txt", "md", "markdown"].includes(extension);
  }

  private async readFileStorageModuleFile(file: IFileStorageModuleFile) {
    const source = this.toLearnText(file.file);

    if (!source) {
      throw new Error("Validation error. File-storage path is required");
    }

    if (/^https?:\/\//i.test(source)) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(
          `Knowledge attachment download failed with status ${response.status}`,
        );
      }

      return response.text();
    }

    const relativePath = normalize(source.replace(/^\/+/, ""));

    if (!relativePath || relativePath.startsWith("..")) {
      throw new Error("Validation error. Invalid file-storage path");
    }

    const candidates = [
      join(process.cwd(), "public", relativePath),
      join(process.cwd(), "apps/api/public", relativePath),
    ];
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        return await readFile(candidate, "utf8");
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Knowledge attachment could not be read from file-storage: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  }

  private toTitle(value: string) {
    return this.toLearnText(value).replace(/\s+/g, " ").trim().slice(0, 120);
  }

  private toSlug(value: string) {
    return this.toLearnText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }

  private sha256(value: string) {
    return createHash("sha256").update(value, "utf8").digest("hex");
  }

  private toLearnText(value: unknown) {
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

  private async createThreadMessage(props: {
    profileId: string;
    chatId: string;
    threadId: string;
    role: "user" | "assistant";
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<ISocialModuleMessage> {
    const rbacSecretKey = RBAC_SECRET_KEY;

    if (!rbacSecretKey) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const title = props.content.replace(/\s+/g, " ").trim().slice(0, 120);
    const message = await socialModuleMessageApi.create({
      data: {
        title: title || props.role,
        description: props.content,
        sourceSystemId: "knowledge",
        interaction: {
          role: props.role,
          content: props.content,
        },
        metadata: props.metadata || {},
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": rbacSecretKey,
        },
      },
    });

    await Promise.all([
      socialModuleProfilesToMessagesApi.create({
        data: {
          profileId: props.profileId,
          messageId: message.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": rbacSecretKey,
          },
        },
      }),
      socialModuleChatsToMessagesApi.create({
        data: {
          chatId: props.chatId,
          messageId: message.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": rbacSecretKey,
          },
        },
      }),
      socialModuleThreadsToMessagesApi.create({
        data: {
          threadId: props.threadId,
          messageId: message.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": rbacSecretKey,
          },
        },
      }),
    ]);

    return message;
  }

  async resolveThreadIdForMessageInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }): Promise<string> {
    const socialModuleChatsToThreads =
      await this.service.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const chatThreadIds =
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    const socialModuleThreadsToMessages =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
        },
      });

    const messageThreadIds =
      socialModuleThreadsToMessages
        ?.map((socialModuleThreadToMessage) => {
          return socialModuleThreadToMessage.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    const chatThreadIdsSet = new Set(chatThreadIds);
    const validMessageThreadIds = messageThreadIds.filter((threadId) =>
      chatThreadIdsSet.has(threadId),
    );

    if (validMessageThreadIds.length > 1) {
      throw new Error(
        "Validation error. Requested message is linked to multiple chat threads",
      );
    }

    if (validMessageThreadIds.length === 1) {
      return validMessageThreadIds[0];
    }

    if (messageThreadIds.length) {
      throw new Error(
        "Validation error. Requested message thread is not linked to the requested chat",
      );
    }

    const socialModuleDefaultThread =
      await this.service.socialModuleChatLifecycleEnsureDefaultThreadForChat({
        socialModuleChatId: props.socialModuleChatId,
      });

    const existingThreadToMessageLinks =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: socialModuleDefaultThread.id,
              },
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!existingThreadToMessageLinks?.length) {
      await this.service.socialModule.threadsToMessages.create({
        data: {
          threadId: socialModuleDefaultThread.id,
          messageId: props.socialModuleMessageId,
        },
      });
    }

    return socialModuleDefaultThread.id;
  }
}

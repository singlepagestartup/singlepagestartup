import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { LlmChatClient } from "@sps/knowledge/backend/app/api/src/lib/generation";
import { getKnowledgeConfiguration } from "@sps/knowledge/backend/app/api/src/lib/configuration";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { createHash } from "node:crypto";
import { getLocalizedProfilePlainText } from "../../../../../../../plain-text";

interface IRequestBody {
  transcript?: string;
  title?: string;
  modelSlug?: string;
}

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;
  llmChatClient: LlmChatClient;

  constructor(service: Service) {
    const config = getKnowledgeConfiguration();

    this.service = service;
    this.knowledgeService = new KnowledgeService();
    this.llmChatClient = new LlmChatClient({
      baseUrl: config.llm.url,
    });
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
      const socialModuleThreadId = this.requireParam(c, "socialModuleThreadId");
      const socialModuleSkillId = this.requireParam(c, "socialModuleSkillId");
      const body = (await c.req.json()) as IRequestBody;
      const transcript = body.transcript?.trim();

      if (!transcript) {
        throw new Error("Validation error. transcript is required");
      }

      await this.assertProfileCanAccessChat({
        subjectId,
        socialModuleProfileId,
        socialModuleChatId,
      });
      await this.assertProfileCanUseSkill({
        socialModuleProfileId,
        socialModuleSkillId,
      });

      const [profile, skill] = await Promise.all([
        this.service.socialModule.profile.findById({
          id: socialModuleProfileId,
        }),
        this.service.socialModule.skill.findById({
          id: socialModuleSkillId,
        }),
      ]);

      if (!profile) {
        throw new Error(
          `Not found error. Social profile ${socialModuleProfileId} was not found`,
        );
      }

      if (!skill) {
        throw new Error(
          `Not found error. Social skill ${socialModuleSkillId} was not found`,
        );
      }

      if (skill.status === "archived") {
        throw new Error(
          `Validation error. Social skill ${skill.slug} is archived`,
        );
      }

      const modelSlug = this.resolveModelSlug({
        skill,
        requested: body.modelSlug,
      });
      const transcriptHash = this.sha256(transcript);
      const knowledgeIngest = await this.knowledgeService.learnContent({
        slug: this.toSlug(
          [
            "knowledge",
            socialModuleProfileId,
            socialModuleThreadId,
            socialModuleSkillId,
            transcriptHash.slice(0, 16),
          ].join("-"),
        ),
        title: body.title || skill.title,
        content: transcript,
        summary: "Transcript imported from social skill run",
        metadata: {
          sourceKind: "transcript",
          sourceSystem: "social-skill",
          socialModuleProfileId,
          socialModuleChatId,
          socialModuleThreadId,
          socialModuleSkillId,
          socialModuleSkillSlug: skill.slug,
          socialSkillTitle: skill.title,
          transcriptHash,
        },
      });
      await this.ensureProfileKnowledgeDocumentRelation({
        socialModuleProfileId,
        knowledgeModuleDocumentId: knowledgeIngest.document.id,
      });
      const prompt = this.buildPrompt({
        profile,
        skill,
        transcript,
        title: body.title,
      });
      const generation = await this.llmChatClient.complete({
        model: modelSlug,
        maxTokens: 2400,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
      });
      const userMessage = await this.createThreadMessage({
        profileId: socialModuleProfileId,
        chatId: socialModuleChatId,
        threadId: socialModuleThreadId,
        role: "user",
        content: this.buildUserMessageContent({
          skillTitle: skill.title,
          transcriptTitle: body.title,
          transcript,
        }),
        metadata: {
          socialSkillRun: {
            role: "user",
            skillId: skill.id,
            skillSlug: skill.slug,
            knowledgeDocumentId: knowledgeIngest.document.id,
            transcriptPreview: transcript.slice(0, 500),
          },
        },
      });
      const assistantMessage = await this.createThreadMessage({
        profileId: socialModuleProfileId,
        chatId: socialModuleChatId,
        threadId: socialModuleThreadId,
        role: "assistant",
        content: generation.answer,
        metadata: {
          socialSkillRun: {
            role: "assistant",
            skillId: skill.id,
            skillSlug: skill.slug,
            knowledgeDocumentId: knowledgeIngest.document.id,
            modelSlug: generation.model || modelSlug,
            provider: generation.provider,
            providerModel: generation.providerModel,
            usage: generation.usage,
          },
        },
      });

      return c.json({
        data: {
          userMessage,
          assistantMessage,
          knowledgeDocument: knowledgeIngest.document,
          knowledgeIndex: knowledgeIngest.index,
          generation: {
            modelSlug: generation.model || modelSlug,
            provider: generation.provider,
            providerModel: generation.providerModel,
            usage: generation.usage,
          },
        },
      });
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

  private async assertProfileCanUseSkill(props: {
    socialModuleProfileId: string;
    socialModuleSkillId: string;
  }) {
    const profilesToSkills =
      await this.service.socialModule.profilesToSkills.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "skillId",
                method: "eq",
                value: props.socialModuleSkillId,
              },
            ],
          },
        },
      });

    if (!profilesToSkills?.length) {
      throw new Error(
        "Authorization error. Requested social skill is not linked to profile",
      );
    }
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

  private resolveModelSlug(props: { skill: any; requested?: string }) {
    return props.requested?.trim() || "openai/gpt-5-5";
  }

  private buildPrompt(props: {
    profile: any;
    skill: any;
    transcript: string;
    title?: string;
  }) {
    return {
      system: [
        "You are executing a stored SPS social.skill.",
        "The skill is a markdown instruction document compatible with Claude and ChatGPT.",
        "Follow the skill exactly. Do not add the generated output to Knowledge. Return only the final content requested by the skill.",
        "",
        `Skill title: ${props.skill.title}`,
        `Skill slug: ${props.skill.slug}`,
        "",
        "Skill instructions:",
        props.skill.description,
      ].join("\n"),
      user: [
        "Use this social profile as business context.",
        `Profile title: ${props.profile.adminTitle || props.profile.slug || "Profile"}`,
        `Profile slug: ${props.profile.slug || ""}`,
        `Profile description: ${getLocalizedProfilePlainText(props.profile.description, "en")}`,
        "",
        props.title ? `Transcript title: ${props.title}` : "",
        "Transcript:",
        props.transcript,
      ].join("\n"),
    };
  }

  private toSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }

  private sha256(value: string) {
    return createHash("sha256").update(value, "utf8").digest("hex");
  }

  private buildUserMessageContent(props: {
    skillTitle: string;
    transcriptTitle?: string;
    transcript: string;
  }) {
    const title = props.transcriptTitle?.trim()
      ? `: ${props.transcriptTitle.trim()}`
      : "";

    return [
      `Skill "${props.skillTitle}" запущен для транскрибации${title}.`,
      "",
      `Фрагмент: ${props.transcript.replace(/\s+/g, " ").trim().slice(0, 280)}`,
    ].join("\n");
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
        sourceSystemId: "social-skill",
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
}

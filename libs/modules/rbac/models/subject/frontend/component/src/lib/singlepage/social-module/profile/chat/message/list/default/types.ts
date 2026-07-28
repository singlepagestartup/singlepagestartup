import type { IModel as IKnowledgeModuleDocument } from "@sps/knowledge/models/document/sdk/model";
import type { TRbacAiReactionReasoning } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";

export interface ProfileSummary {
  href: string;
  id: string;
  initial: string;
  slug: string;
}

export interface KnowledgeChatCommand {
  description: string;
  insertValue?: string;
  title: string;
  value: string;
}

export interface KnowledgeMentionOption {
  description: string;
  slug: "knowledge";
  title: string;
}

export interface KnowledgeDocumentDraft {
  description: string;
  title: string;
}

export interface SkillCreateValues {
  description: string;
  slug: string;
  title: string;
}

export interface SkillCreateContext {
  orderIndex: number;
  profileId: string;
}

export interface SkillUpdateValues extends SkillCreateValues {}

export type OpenRouterReasoningValue = TRbacAiReactionReasoning;
export type OpenRouterReasoningEffort = Exclude<
  OpenRouterReasoningValue,
  "auto"
>;

export interface OpenRouterReasoningOption {
  label: string;
  value: OpenRouterReasoningValue;
}

export interface OpenRouterChatModelReasoning {
  defaultEffort: OpenRouterReasoningEffort | null;
  defaultEnabled: boolean | null;
  mandatory: boolean;
  supportedEfforts: OpenRouterReasoningEffort[];
  supportsMaxTokens: boolean;
}

export interface OpenRouterChatModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  supportsReasoning: boolean;
  reasoning: OpenRouterChatModelReasoning | null;
}

export interface OpenRouterChatModelGroup {
  id: "text" | "vision_file" | "image" | "audio";
  title: string;
  models: OpenRouterChatModelOption[];
}

export type KnowledgeDocument = IKnowledgeModuleDocument;
export type SocialSkill = ISocialModuleSkill;

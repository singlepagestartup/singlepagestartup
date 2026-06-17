import type { IModel as IKnowledgeModuleDocument } from "@sps/knowledge/models/document/sdk/model";
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
  status: "draft" | "active" | "archived";
  title: string;
}

export interface SkillCreateContext {
  orderIndex: number;
  profileId: string;
}

export interface SkillUpdateValues extends SkillCreateValues {}

export type OpenRouterReasoningValue =
  | "auto"
  | "none"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export interface OpenRouterChatModelOption {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  supportsReasoning: boolean;
}

export interface OpenRouterChatModelGroup {
  id: "text" | "vision_file" | "image" | "audio";
  title: string;
  models: OpenRouterChatModelOption[];
}

export type KnowledgeDocument = IKnowledgeModuleDocument;
export type SocialSkill = ISocialModuleSkill;

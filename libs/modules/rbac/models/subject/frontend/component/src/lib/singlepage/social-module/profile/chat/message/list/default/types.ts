import type { IModel as IKnowledgeModuleSource } from "@sps/knowledge/models/source/sdk/model";
import type { TRbacAiReactionReasoning } from "@sps/rbac/models/subject/sdk/model";
import type { IResult as ISubjectResults } from "@sps/rbac/models/subject/sdk/client";
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

export interface KnowledgeSourceDraft {
  content: string;
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
export interface OpenRouterReasoningOption {
  label: string;
  labelRu: string;
  value: OpenRouterReasoningValue;
}

type TChatModelGroups =
  ISubjectResults["ISocialModuleProfileFindByIdChatFindByIdOpenrouterModelFindResult"]["groups"];

export interface IChatModelControls {
  mode: "assistant" | "order";
  favoriteModelIds: string[];
  isLoadingModels: boolean;
  isSelectionUnavailable: boolean;
  isUpdatingFavorites: boolean;
  modelGroups: TChatModelGroups;
  onFavoriteToggle: (canonicalId: string) => void;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (effort: OpenRouterReasoningValue) => void;
  reasoningOptions: OpenRouterReasoningOption[];
  selectedModelId: string;
  selectedModelLabel: string;
  selectedReasoning: OpenRouterReasoningValue;
}

export type KnowledgeSource = IKnowledgeModuleSource;
export type SocialSkill = ISocialModuleSkill;

export { type IModel } from "@sps/social/models/profile/sdk/model";
import { IModel } from "@sps/social/models/profile/sdk/model";
import { IModel as IKnowledgeModuleSource } from "@sps/knowledge/models/source/sdk/model";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-profile-sidebar" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  skills?: ISocialModuleSkill[];
  knowledgeSources?: IKnowledgeModuleSource[];
  selectedKnowledgeSource?: IKnowledgeModuleSource | null;
  isSkillsLoading?: boolean;
  isKnowledgeSourcesLoading?: boolean;
  hasKnowledgeSourcesError?: boolean;
  onKnowledgeSourceCreate?: (profile: IModel) => void;
  onKnowledgeSourceSelect?: (document: IKnowledgeModuleSource) => void;
  onMcpServersEdit?: (profile: IModel) => void;
  onProfileEdit?: (profile: IModel) => void;
  onSkillCreate?: (profile: IModel) => void;
  onSkillEdit?: (skill: ISocialModuleSkill) => void;
  onClose?: () => void;
}

export interface IComponentProps
  extends ISpsComponentBase,
    IClientComponentProps {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}

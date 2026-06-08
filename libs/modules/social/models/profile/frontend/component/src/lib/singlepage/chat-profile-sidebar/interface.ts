export { type IModel } from "@sps/social/models/profile/sdk/model";
import { IModel } from "@sps/social/models/profile/sdk/model";
import { IModel as IKnowledgeModuleDocument } from "@sps/knowledge/models/document/sdk/model";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-profile-sidebar" as const;

export interface IClientComponentProps
  extends Pick<ISpsComponentBase, "className" | "isServer"> {
  data: IModel;
  language: string;
  skills?: ISocialModuleSkill[];
  knowledgeDocuments?: IKnowledgeModuleDocument[];
  selectedKnowledgeDocument?: IKnowledgeModuleDocument | null;
  isSkillsLoading?: boolean;
  isKnowledgeDocumentsLoading?: boolean;
  onKnowledgeDocumentCreate?: (profile: IModel) => void;
  onKnowledgeDocumentSelect?: (document: IKnowledgeModuleDocument) => void;
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

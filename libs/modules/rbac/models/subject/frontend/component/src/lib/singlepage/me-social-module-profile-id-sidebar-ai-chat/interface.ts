import type { ReactNode } from "react";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IAIChatProject } from "@sps/rbac/models/subject/sdk/model";
export const variant = "me-social-module-profile-id-sidebar-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  project: IAIChatProject;
  profileId: string;
  onClose: () => void;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  profilesRead: {
    data?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindResult"];
    isPending?: boolean;
    error?: { message: string };
  };
  skillsRead: {
    data?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFindResult"];
    isPending?: boolean;
    error?: { message: string };
  };
  knowledgeRead: {
    data?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindResult"];
    isPending?: boolean;
    error?: { message: string };
  };
  sourceFiles?: Record<string, ReactNode>;
}
export interface ISourceFilesProps {
  files?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFindResult"];
  error?: string;
}
export interface ISourceFilesReaderProps {
  scope: {
    id: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
    options?: NonNullable<IComponentProps["apiProps"]>["options"];
  };
  profileId: string;
  sourceId: string;
}

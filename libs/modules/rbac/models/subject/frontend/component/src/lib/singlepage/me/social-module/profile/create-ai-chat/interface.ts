import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type {
  IModel,
  IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";

export const variant = "me-social-module-profile-create-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  projects?: IAIChatProject[];
  hideBackLink?: boolean;
  pending?: boolean;
  project?: IAIChatProject;
  socialModuleThreadId?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

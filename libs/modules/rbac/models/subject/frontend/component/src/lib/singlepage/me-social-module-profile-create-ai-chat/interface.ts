import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IAIChatProject } from "@sps/rbac/models/subject/sdk/model";

export const variant = "me-social-module-profile-create-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  projects?: IAIChatProject[];
  hideBackLink?: boolean;
  pending?: boolean;
  project?: IAIChatProject;
  threadId?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

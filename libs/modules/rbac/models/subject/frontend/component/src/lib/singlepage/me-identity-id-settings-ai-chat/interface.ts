import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "me-identity-id-settings-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  identity: IIdentity;
  canRemove: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

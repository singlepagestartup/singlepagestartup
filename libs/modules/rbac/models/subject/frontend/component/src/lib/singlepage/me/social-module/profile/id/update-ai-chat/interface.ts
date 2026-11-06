import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";

import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "me-social-module-profile-id-update-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  profile: IProfile;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

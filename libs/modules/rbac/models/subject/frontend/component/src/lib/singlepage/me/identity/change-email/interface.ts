import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";

export const variant = "me-identity-change-email" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  identity: IIdentity;
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

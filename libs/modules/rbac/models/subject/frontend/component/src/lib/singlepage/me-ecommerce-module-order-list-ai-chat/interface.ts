import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";

export const variant = "me-ecommerce-module-order-list-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

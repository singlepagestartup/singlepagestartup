import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant =
  "subject-me-ecommerce-module-store-overview-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  ecommerceModuleStoreSlug?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IContentProps {
  isServer: boolean;
  language: string;
  ecommerceModuleStoreSlug?: string;
}

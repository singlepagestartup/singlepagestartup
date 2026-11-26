import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant =
  "subject-me-ecommerce-module-store-order-detail" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  ecommerceModuleStoreSlug: string;
  ecommerceModuleOrderId: string;
  language?: string;
}

export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

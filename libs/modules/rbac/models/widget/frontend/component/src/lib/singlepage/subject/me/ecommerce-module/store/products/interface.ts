import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type { IStoreSectionContentProps } from "../StoreSection";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "subject-me-ecommerce-module-store-products" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  ecommerceModuleStoreSlug: string;
  language?: string;
}

export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IProductPageProps extends IStoreSectionContentProps {
  ecommerceModuleProductId: string;
}

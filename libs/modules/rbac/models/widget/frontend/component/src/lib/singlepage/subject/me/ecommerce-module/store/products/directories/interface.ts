import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const directories = {
  "subject-me-ecommerce-module-store-product-categories": "categories",
  "subject-me-ecommerce-module-store-product-attribute-keys": "attribute-keys",
  "subject-me-ecommerce-module-store-product-attributes": "attributes",
} as const;

export interface IComponentProps extends IParent<
  IModel,
  keyof typeof directories
> {
  ecommerceModuleStoreSlug: string;
  language?: string;
}
export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  keyof typeof directories,
  IComponentProps
> {}

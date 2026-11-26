import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
export { type IModel } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/sdk/model";
import { IModel } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  ecommerceModuleStoreId?: string;
  ecommerceModuleStore?: IEcommerceModuleStore;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

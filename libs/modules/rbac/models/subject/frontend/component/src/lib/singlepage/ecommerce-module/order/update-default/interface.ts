export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";

export const variant = "ecommerce-module-order-update-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  product: IEcommerceModuleProduct;
  order: IEcommerceModuleOrder;
  store?: IEcommerceModuleStore;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

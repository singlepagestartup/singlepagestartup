import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
export { type IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "store-header-default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  storeId: string;
  store?: IStore;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

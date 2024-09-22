export { type IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ReactNode } from "react";

export const variant = "product-overview-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  children?: ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

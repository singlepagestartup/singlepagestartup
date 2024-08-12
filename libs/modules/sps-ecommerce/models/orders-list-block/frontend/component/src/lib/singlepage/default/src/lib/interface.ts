export { type IModel } from "@sps/sps-ecommerce/models/orders-list-block/sdk/model";
import { IModel } from "@sps/sps-ecommerce/models/orders-list-block/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ReactNode } from "react";

export const variant = "default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {
  content?: ReactNode;
  logotype?: ReactNode;
}

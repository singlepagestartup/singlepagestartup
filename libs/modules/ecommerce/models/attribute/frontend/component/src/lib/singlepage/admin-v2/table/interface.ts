export { type IModel } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel } from "@sps/ecommerce/models/attribute/sdk/model";
import { ReactNode } from "react";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/table/interface";

export const variant = "admin-v2-table" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  header?: ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

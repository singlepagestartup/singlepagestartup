export { type IModel } from "@sps/host/relations/pages-to-widgets/sdk/model";
import { IModel } from "@sps/host/relations/pages-to-widgets/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin/table-row/interface";
import { ReactNode } from "react";

export const variant = "admin-table-row" as const;

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

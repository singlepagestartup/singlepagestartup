export { type IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin/form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  widgetsToCategories?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToStores?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export { type IModel } from "@sps/host/models/widget/sdk/model";
import { IModel } from "@sps/host/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-form2/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  pagesToWidgets?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  layoutsToWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToExternalModules?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export { type IModel } from "@sps/host/models/layout/sdk/model";
import { IModel } from "@sps/host/models/layout/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  layoutsToWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  pagesToLayouts?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;

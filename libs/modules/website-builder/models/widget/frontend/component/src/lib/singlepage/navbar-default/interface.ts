export { type IModel } from "@sps/website-builder/models/widget/sdk/model";
import { IModel } from "@sps/website-builder/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ReactNode } from "react";

export const variant = "navbar-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {
  content?: ReactNode;
  logotype?: ReactNode;
}

export interface IClientComponentProps {
  data: IModel;
  variant: typeof variant;
  language: string;
  className?: string;
  logotype?: ReactNode;
  content?: ReactNode;
  children?: ReactNode;
}

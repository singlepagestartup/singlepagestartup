export { type IModel } from "@sps/sps-website-builder/models/widget/sdk/model";
import { IModel } from "@sps/sps-website-builder/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  widgetsToFeaturesSectionBlocks?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToFooterBlocks?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToContentSectionBlocks?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToNavbarBlocks?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToSliderBlocks?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

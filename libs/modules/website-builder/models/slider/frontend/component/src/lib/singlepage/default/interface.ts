export { type IModel } from "@sps/website-builder/models/slider/sdk/model";
import { IModel } from "@sps/website-builder/models/slider/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { ReactNode } from "react";

export const variant = "default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  navigation?: "arrows" | "numbers" | "dots";
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {
  slides?: IRenderedSlide[];
}

export interface IRenderedSlide {
  id: string;
  content: ReactNode;
}

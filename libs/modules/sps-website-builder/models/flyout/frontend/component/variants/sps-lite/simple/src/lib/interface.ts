import { ReactNode } from "react";
import {
  IModel,
  variants,
} from "@sps/sps-website-builder-models-flyout-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-models-flyout-contracts-extended";

export const variant: (typeof variants)[number] = "simple" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModelExtended;
}

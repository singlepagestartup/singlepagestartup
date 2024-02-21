import {
  IModel,
  variants,
} from "@sps/sps-website-builder-reviews-table-block-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-reviews-table-block-contracts-extended";

export const variant: (typeof variants)[number] = "simple" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: IModel;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModelExtended;
}
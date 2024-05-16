import {
  IModel,
  variants,
} from "@sps/sps-website-builder-models-footer-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-models-footer-contracts-extended";

export const variant: (typeof variants)[number] = "boxed" as const;

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

import {
  IModel,
  variants,
} from "@sps/sps-website-builder-models-incentives-block-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-models-incentives-block-contracts-extended";

export const variant: (typeof variants)[number] =
  "four-column-with-illustrations" as const;

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

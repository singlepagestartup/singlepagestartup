import { IModel } from "@sps/sps-website-builder-models-button-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-models-button-contracts-extended";

export const variant = "locale" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
  onClick?: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModelExtended;
}

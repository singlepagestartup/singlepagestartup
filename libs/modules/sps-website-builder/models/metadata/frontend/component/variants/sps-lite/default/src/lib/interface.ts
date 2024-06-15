import { IModel } from "@sps/sps-website-builder-models-metadata-contracts";
import { IModel as IModelExtended } from "@sps/sps-website-builder-models-metadata-contracts-extended";

export const variant = "default" as const;

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

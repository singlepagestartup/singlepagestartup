import { IModel } from "@sps/sps-rbac-models-permission-contracts";
import { IModel as IModelExtended } from "@sps/sps-rbac-models-permission-contracts-extended";
import { Dispatch, SetStateAction } from "react";

export const variant = "find-by-id" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  id: string;
  set?: Dispatch<SetStateAction<IModelExtended | undefined>>;
  children?: ({ data }: { data: IModelExtended }) => any;
}

export interface IComponentPropsExtended extends IComponentProps {}
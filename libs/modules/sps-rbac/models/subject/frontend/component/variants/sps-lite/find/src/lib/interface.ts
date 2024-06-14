import { IModel } from "@sps/sps-rbac-models-subject-contracts";
import { IModel as IModelExtended } from "@sps/sps-rbac-models-subject-contracts-extended";
import { Dispatch, SetStateAction } from "react";

export const variant = "find" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  set?: Dispatch<SetStateAction<IModelExtended[] | undefined>>;
  children?: ({ data }: { data: IModelExtended[] }) => any;
  query?: any;
}

export interface IComponentPropsExtended extends IComponentProps {}
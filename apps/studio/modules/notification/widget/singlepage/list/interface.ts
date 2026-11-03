import type { IRecord } from "../admin-v2-table/interface";

export const variant = "list";

export interface IProps {
  variant?: "list";
  data?: IRecord[];
  count?: number;
  empty?: boolean;
  className?: string;
}

type IVariantInputs = NonNullable<IProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list";
}

export interface IComponentPropsExtended extends IComponentProps {}

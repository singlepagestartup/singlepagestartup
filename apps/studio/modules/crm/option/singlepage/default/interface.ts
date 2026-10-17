import type { CrmOptionRecord } from "../../../shared/demo-crm";

export const variant = "default";

export interface CrmOptionDefaultProps {
  variant?: "default";
  option: CrmOptionRecord;
}

type IVariantInputs = NonNullable<Partial<CrmOptionDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}

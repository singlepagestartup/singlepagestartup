import type { CrmInputRecord } from "../../../shared/demo-crm";

export const variant = "text-default";

export interface CrmInputTextDefaultProps {
  variant?: "text-default";
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

type IVariantInputs = NonNullable<Partial<CrmInputTextDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "text-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

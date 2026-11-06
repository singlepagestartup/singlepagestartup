import type { CrmRequestRecord } from "../../../shared/demo-crm";

export const variant = "default";

export interface CrmRequestDefaultProps {
  variant?: "default";
  request: CrmRequestRecord;
}

type IVariantInputs = NonNullable<Partial<CrmRequestDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}

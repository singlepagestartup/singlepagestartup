import type { IStudioAttribute } from "../../shared";

export const variant = "admin-v2-form";

export interface IAttributeAdminFormProps {
  variant?: "admin-v2-form";
  attribute?: IStudioAttribute;
  onSave?: (attribute: IStudioAttribute) => void;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<IAttributeAdminFormProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-form";
}

export interface IComponentPropsExtended extends IComponentProps {}

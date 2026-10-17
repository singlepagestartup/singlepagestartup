export const variant = "rbac-module-subject-me-authentication-select-method";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-authentication-select-method";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-authentication-select-method";
}

export interface IComponentPropsExtended extends IComponentProps {}

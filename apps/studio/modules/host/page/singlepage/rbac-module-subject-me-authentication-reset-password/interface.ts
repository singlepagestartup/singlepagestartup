export const variant = "rbac-module-subject-me-authentication-reset-password";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-authentication-reset-password";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-authentication-reset-password";
}

export interface IComponentPropsExtended extends IComponentProps {}

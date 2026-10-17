export const variant = "rbac-module-subject-me-settings";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-settings";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}

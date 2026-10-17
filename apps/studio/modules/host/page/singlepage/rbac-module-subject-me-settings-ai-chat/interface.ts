export const variant = "rbac-module-subject-me-settings-ai-chat";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-settings-ai-chat";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-settings-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

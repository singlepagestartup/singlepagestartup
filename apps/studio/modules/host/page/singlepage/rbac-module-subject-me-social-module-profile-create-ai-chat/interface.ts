export const variant =
  "rbac-module-subject-me-social-module-profile-create-ai-chat";

export interface IComponentVariantProps {
  variant?: "rbac-module-subject-me-social-module-profile-create-ai-chat";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-social-module-profile-create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

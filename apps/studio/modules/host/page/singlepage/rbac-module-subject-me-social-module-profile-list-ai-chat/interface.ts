export const variant =
  "rbac-module-subject-me-social-module-profile-list-ai-chat";

export interface IProjectsPageProps {
  variant?: "rbac-module-subject-me-social-module-profile-list-ai-chat";
  state?: "ready" | "sign-in-required";
  creating?: boolean;
  onCreatingChange?: (creating: boolean) => void;
}

type IVariantInputs = NonNullable<IProjectsPageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-social-module-profile-list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

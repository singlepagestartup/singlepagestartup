import type { IComponentProps as IRbacModuleWidgetProps } from "../../../../rbac/widget";

export const variant =
  "rbac-module-subject-me-authentication-select-method-ai-chat";

export interface ILoginPageProps {
  variant?: "rbac-module-subject-me-authentication-select-method-ai-chat";
  copy?: Extract<
    IRbacModuleWidgetProps,
    { variant: "subject-me-authentication-select-method-ai-chat" }
  >["copy"];
}

type IVariantInputs = NonNullable<ILoginPageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-authentication-select-method-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

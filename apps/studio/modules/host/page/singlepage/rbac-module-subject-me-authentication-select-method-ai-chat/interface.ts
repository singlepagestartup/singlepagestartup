import type { ILoginCopy } from "../../../../rbac/subject/index";

import type { IAuthenticationContent } from "../../../../website-builder/widget";

export const variant =
  "rbac-module-subject-me-authentication-select-method-ai-chat";

export interface ILoginPageProps {
  variant?: "rbac-module-subject-me-authentication-select-method-ai-chat";
  copy?: { form: ILoginCopy; content: IAuthenticationContent };
}

type IVariantInputs = NonNullable<ILoginPageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-authentication-select-method-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

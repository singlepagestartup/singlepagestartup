import type { ILoginCopy } from "../../../subject";
import type { IAuthenticationContent } from "../../../../website-builder/widget";
export const variant =
  "subject-me-authentication-select-method-ai-chat" as const;
export interface IProps {
  copy?: { form: ILoginCopy; content: IAuthenticationContent };
  onSuccess?: (email: string) => void;
}
export interface IComponentProps extends IProps {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}

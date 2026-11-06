import { AuthenticationPresentation } from "../authentication/Component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps = {}) {
  return (
    <AuthenticationPresentation variant="content-ai-chat-reset-password">
      {props.children}
    </AuthenticationPresentation>
  );
}

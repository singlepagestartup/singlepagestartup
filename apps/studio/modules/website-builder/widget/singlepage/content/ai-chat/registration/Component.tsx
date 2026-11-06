import { AuthenticationPresentation } from "../authentication/Component";
import content from "../authentication/registration.json";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps = {}) {
  return (
    <AuthenticationPresentation
      variant="content-ai-chat-registration"
      content={content}
      media="stack"
      asideIcon="shield-check"
    >
      {props.children}
    </AuthenticationPresentation>
  );
}

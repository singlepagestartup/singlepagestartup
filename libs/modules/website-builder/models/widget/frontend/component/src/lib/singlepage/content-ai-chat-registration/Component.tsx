import { AuthenticationPresentation } from "../content-ai-chat-authentication/Component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <AuthenticationPresentation
      isServer={props.isServer}
      variant="content-ai-chat-registration"
      data={props.data}
      language={props.language}
      className={props.className}
    >
      {props.children}
    </AuthenticationPresentation>
  );
}

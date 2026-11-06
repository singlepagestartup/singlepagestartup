import { ChatWorkspace } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="social"
      data-model="profile"
      data-variant="id-ai-chat-project"
      data-id={props.data.id}
      className="min-w-0"
    >
      <ChatWorkspace navigation={props.navigation}>
        {props.children}
      </ChatWorkspace>
    </section>
  );
}

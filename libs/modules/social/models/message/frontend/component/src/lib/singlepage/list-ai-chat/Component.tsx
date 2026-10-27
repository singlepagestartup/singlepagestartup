import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      language={props.language}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      threadId={props.threadId}
      documentTitle={props.documentTitle}
      emptyMessage={props.emptyMessage}
      requesterProfileId={props.requesterProfileId}
      assistantProfileId={props.assistantProfileId}
      onProfileOpen={props.onProfileOpen}
    />
  );
}

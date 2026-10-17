import { Component as ClientComponent } from "./ClientComponent";
import type { IEmptyComponentProps } from "./interface";
export function Component(props: IEmptyComponentProps) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant="select-ai-chat-project"
      createHref={props.createHref}
      className={props.className}
      pending={props.pending}
      empty={props.empty}
      error={props.error}
      onRetry={props.onRetry}
      children={props.children}
    />
  );
}

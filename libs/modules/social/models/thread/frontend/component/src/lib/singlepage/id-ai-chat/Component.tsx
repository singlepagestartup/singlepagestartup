import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      language={props.language}
      data={props.data}
      className={props.className}
      children={props.children}
      messages={props.messages}
      composer={props.composer}
      context={props.context}
      navigation={props.navigation}
    />
  );
}

import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      messages={props.messages}
      composer={props.composer}
      isDocument={props.isDocument}
      knowledge={props.knowledge}
      documentDownload={props.documentDownload}
      navigation={props.navigation}
    />
  );
}

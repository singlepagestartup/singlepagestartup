import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { Component as Content } from "./assets/content";
import { Component as Logotype } from "./assets/logotype";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      data={props.data}
      variant={props.variant}
      language={props.language}
      className={props.className}
      logotype={
        <Logotype
          data={props.data}
          variant={props.variant}
          language={props.language}
          isServer={props.isServer}
        />
      }
      content={
        <Content
          data={props.data}
          variant={props.variant}
          language={props.language}
          isServer={props.isServer}
        />
      }
      children={props.children}
    />
  );
}

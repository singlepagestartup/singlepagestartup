import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      id={props.id}
      language={props.language}
      notificationsToTemplates={props.notificationsToTemplates}
      className={props.className}
    />
  );
}

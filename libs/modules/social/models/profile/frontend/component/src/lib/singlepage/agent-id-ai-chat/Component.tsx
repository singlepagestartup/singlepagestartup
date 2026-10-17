import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      language={props.language}
      onClose={props.onClose}
      skills={props.skills}
      skillsCount={props.skillsCount}
      knowledgeCount={props.knowledgeCount}
      children={props.children}
    />
  );
}

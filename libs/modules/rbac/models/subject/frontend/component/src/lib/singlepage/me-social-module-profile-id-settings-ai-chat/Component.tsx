import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  if (!props.project)
    return (
      <p role="alert" className="p-8">
        Choose a project.
      </p>
    );
  return (
    <ClientComponent
      key={props.project.profile.id}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      projects={props.projects}
      project={props.project}
      threadId={props.threadId}
    />
  );
}

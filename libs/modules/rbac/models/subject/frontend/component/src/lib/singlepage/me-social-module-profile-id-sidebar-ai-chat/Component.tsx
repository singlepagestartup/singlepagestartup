import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      profilesRead={props.profilesRead}
      skillsRead={props.skillsRead}
      knowledgeRead={props.knowledgeRead}
      sourceFiles={props.sourceFiles}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      project={props.project}
      profileId={props.profileId}
      onClose={props.onClose}
    />
  );
}

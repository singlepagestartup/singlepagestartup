import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      language={props.language}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      projects={props.projects}
      hideBackLink={props.hideBackLink}
      pending={props.pending}
      project={props.project}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}

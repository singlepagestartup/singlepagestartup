import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      skeleton={props.skeleton}
      variant={props.variant}
      data={props.data}
      apiProps={props.apiProps}
      className={props.className}
      defaultProfileId={props.defaultProfileId}
      defaultBlogModuleArticleId={props.defaultBlogModuleArticleId}
      panelDepth={props.panelDepth}
      isTop={props.isTop}
    />
  );
}

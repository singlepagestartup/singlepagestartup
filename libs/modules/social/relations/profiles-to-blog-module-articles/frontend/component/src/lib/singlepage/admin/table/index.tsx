import { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentProps) {
  return (
    <ClientComponent
      isServer={false}
      skeleton={props.skeleton}
      variant={props.variant}
      apiProps={props.apiProps}
      className={props.className}
      adminForm={props.adminForm}
      page={props.page}
      limit={props.limit}
      debouncedSearch={props.debouncedSearch}
      offset={props.offset}
      defaultProfileId={props.defaultProfileId}
      defaultBlogModuleArticleId={props.defaultBlogModuleArticleId}
    />
  );
}

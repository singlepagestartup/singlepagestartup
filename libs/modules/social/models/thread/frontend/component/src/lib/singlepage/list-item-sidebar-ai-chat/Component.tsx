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
      language={props.language}
      href={props.href}
      selected={props.selected}
      topic={props.topic}
      title={props.title}
      activityAt={props.activityAt}
      unreadCount={props.unreadCount}
      preview={props.preview}
      previewAuthor={props.previewAuthor}
      onNavigate={props.onNavigate}
    />
  );
}

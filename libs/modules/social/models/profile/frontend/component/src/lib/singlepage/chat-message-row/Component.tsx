import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      className={props.className}
      data={props.data}
      profile={props.profile}
      avatar={props.avatar}
      language={props.language}
      message={props.message}
      attachmentsSlot={props.attachmentsSlot}
      messageContentSlot={props.messageContentSlot}
      interactionSlot={props.interactionSlot}
      isDeleting={props.isDeleting}
      isOwnMessage={props.isOwnMessage}
      onProfileOpen={props.onProfileOpen}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  );
}

import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      className={props.className}
      socialModuleProfile={props.socialModuleProfile}
      socialModuleChats={props.socialModuleChats}
      search={props.search}
      onSearch={props.onSearch}
      pagination={props.pagination}
      currentSocialModuleChatId={props.currentSocialModuleChatId}
      compact={props.compact}
      currentChatActions={props.currentChatActions}
      onSelectCurrentChat={props.onSelectCurrentChat}
    />
  );
}

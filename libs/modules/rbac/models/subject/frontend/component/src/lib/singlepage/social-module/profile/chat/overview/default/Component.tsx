import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { CustomerWork } from "../../message/list/default/components/CustomerWork";

export function Component(props: IComponentPropsExtended) {
  if (
    props.socialModuleChat.variant === "customer-work" &&
    props.socialModuleThreadId
  ) {
    return (
      <CustomerWork
        subjectId={props.data.id}
        threadId={props.socialModuleThreadId}
        language={props.language}
      />
    );
  }
  return (
    <ClientComponent
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      language={props.language}
      className={props.className}
      socialModuleProfile={props.socialModuleProfile}
      socialModuleChat={props.socialModuleChat}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}

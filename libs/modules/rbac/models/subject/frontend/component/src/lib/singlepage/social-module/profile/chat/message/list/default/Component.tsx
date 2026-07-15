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
      artificialIntelligenceOpponentProfile={
        props.artificialIntelligenceOpponentProfile
      }
      knowledgeAssistantProfile={props.knowledgeAssistantProfile}
      socialModuleChat={props.socialModuleChat}
      socialModuleThread={props.socialModuleThread}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}

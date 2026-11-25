import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      key={JSON.stringify([
        props.data.id,
        props.socialModuleProfile.id,
        props.socialModuleChat.id,
        props.socialModuleThreadId,
      ])}
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
      navigation={props.navigation}
      profileOpenRef={props.profileOpenRef}
    />
  );
}

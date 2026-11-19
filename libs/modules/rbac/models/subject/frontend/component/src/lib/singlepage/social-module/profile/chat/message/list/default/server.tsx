"use server";
import "server-only";

import { IComponentProps } from "./interface";
import Client from "./client";

/**
 * The browser session loads the owner project, messages, and actions.
 */
export default async function Component(props: IComponentProps) {
  return (
    <Client
      isServer={false}
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
    />
  );
}

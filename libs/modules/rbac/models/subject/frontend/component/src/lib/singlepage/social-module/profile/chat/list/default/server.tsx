"use server";
import "server-only";

import type { IComponentProps } from "./interface";
import Client from "./client";

export default async function Component(props: IComponentProps) {
  return (
    <Client
      isServer={false}
      variant={props.variant}
      language={props.language}
      data={props.data}
      socialModuleProfile={props.socialModuleProfile}
      includeSubjectProfiles={props.includeSubjectProfiles}
      currentSocialModuleChatId={props.currentSocialModuleChatId}
      compact={props.compact}
      className={props.className}
      currentChatActions={props.currentChatActions}
    />
  );
}

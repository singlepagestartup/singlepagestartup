"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  if (!props.socialModuleChatId)
    return <p role="status">Choose a chat to view its messages.</p>;
  return (
    <Subject
      isServer={false}
      variant="me-social-module-profile-chat-overview-default"
      language={props.language}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}

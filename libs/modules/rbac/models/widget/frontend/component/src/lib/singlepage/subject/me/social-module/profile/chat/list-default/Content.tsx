"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  return (
    <Subject
      isServer={false}
      variant="me-social-module-profile-chat-list-default"
      language={props.language}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}

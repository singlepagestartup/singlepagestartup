"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { IComponentProps } from "./interface";

export default function Component(props: IComponentProps) {
  const chat = api.socialModuleProfileFindByIdChatFindById({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChatId,
  });
  if (chat.isError || chat.data?.canManageChat !== true) return null;
  return <ChildComponent {...props} />;
}

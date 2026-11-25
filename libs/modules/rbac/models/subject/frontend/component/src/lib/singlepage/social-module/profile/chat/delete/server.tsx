"use server";
import "server-only";

import { api } from "@sps/rbac/models/subject/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Component(props: IComponentProps) {
  const chat = await api.socialModuleProfileFindByIdChatFindById({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChatId,
  });
  if (chat.canManageChat !== true) return null;
  return <ChildComponent {...props} />;
}

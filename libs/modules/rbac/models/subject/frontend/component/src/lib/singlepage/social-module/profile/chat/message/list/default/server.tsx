"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { api } from "@sps/rbac/models/subject/sdk/server";

export default async function Component(props: IComponentProps) {
  const socialModuleMessages =
    await api.socialModuleProfileFindByIdChatFindByIdMessageFind({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });
  const socialModuleActions =
    await api.socialModuleProfileFindByIdChatFindByIdActionFind({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

  const socialModuleMessagesAndActionsQuery =
    socialModuleMessages && socialModuleActions
      ? [
          ...socialModuleMessages.map((socialModuleMessage) => {
            return {
              type: "message" as const,
              data: socialModuleMessage,
            };
          }),
          ...socialModuleActions.map((socialModuleAction) => {
            return {
              type: "action" as const,
              data: socialModuleAction,
            };
          }),
        ]
      : [];

  return (
    <ChildComponent
      {...props}
      socialModuleMessagesAndActionsQuery={socialModuleMessagesAndActionsQuery}
      socialModuleMessages={socialModuleMessages}
      socialModuleActions={socialModuleActions}
    />
  );
}

"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { createSocialModuleMessagesAndActionsQuery } from "./timeline";

export default async function Component(props: IComponentProps) {
  const socialModuleMessages =
    await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: props.socialModuleThreadId,
      params: {
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
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
      params: {
        socialModuleThreadId: props.socialModuleThreadId,
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

  const socialModuleMessagesAndActionsQuery =
    createSocialModuleMessagesAndActionsQuery({
      socialModuleMessages,
      socialModuleActions,
    });

  return (
    <ChildComponent
      {...props}
      socialModuleMessagesAndActionsQuery={socialModuleMessagesAndActionsQuery}
      socialModuleMessages={socialModuleMessages}
      socialModuleActions={socialModuleActions}
    />
  );
}

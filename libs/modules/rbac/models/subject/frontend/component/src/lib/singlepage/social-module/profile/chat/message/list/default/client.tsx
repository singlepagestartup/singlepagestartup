"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Skeleton } from "./Skeleton";

export default function Component(props: IComponentProps) {
  const {
    data: socialModuleMessages,
    isLoading: socialModuleMessagesIsLoading,
  } = api.socialModuleProfileFindByIdChatFindByIdMessageFind({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    socialModuleChatId: props.socialModuleChat.id,
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
  const { data: socialModuleActions, isLoading: socialModuleActionsIsLoading } =
    api.socialModuleProfileFindByIdChatFindByIdActionFind({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
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

  if (socialModuleMessagesIsLoading || socialModuleActionsIsLoading) {
    return <Skeleton />;
  }

  return (
    <ChildComponent
      {...props}
      socialModuleMessages={socialModuleMessages}
      socialModuleActions={socialModuleActions}
    />
  );
}

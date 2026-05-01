"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Skeleton } from "./Skeleton";
import { useMemo } from "react";
import { createSocialModuleMessagesAndActionsQuery } from "./timeline";

export default function Component(props: IComponentProps) {
  const {
    data: socialModuleMessages,
    isLoading: socialModuleMessagesIsLoading,
  } = api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind({
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
  const { data: socialModuleActions, isLoading: socialModuleActionsIsLoading } =
    api.socialModuleProfileFindByIdChatFindByIdActionFind({
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

  const socialModuleMessagesAndActionsQuery = useMemo(() => {
    return createSocialModuleMessagesAndActionsQuery({
      socialModuleMessages,
      socialModuleActions,
    });
  }, [socialModuleMessages, socialModuleActions]);

  if (socialModuleMessagesIsLoading || socialModuleActionsIsLoading) {
    return <Skeleton />;
  }

  return (
    <ChildComponent
      {...props}
      socialModuleMessagesAndActionsQuery={socialModuleMessagesAndActionsQuery}
      socialModuleMessages={socialModuleMessages}
      socialModuleActions={socialModuleActions}
    />
  );
}

"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Skeleton } from "./Skeleton";
import { useMemo } from "react";

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

  const socialModuleMessagesAndActionsQuery = useMemo(() => {
    return socialModuleMessages && socialModuleActions
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
        ].sort((a, b) => {
          if (a.data.createdAt <= b.data.createdAt) {
            return -1;
          } else if (a.data.createdAt > b.data.createdAt) {
            return 1;
          }
          return 0;
        })
      : [];
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

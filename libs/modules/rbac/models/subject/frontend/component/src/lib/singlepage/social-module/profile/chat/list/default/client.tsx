"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Skeleton } from "./Skeleton";

export default function Component(props: IComponentProps) {
  const { data, isLoading } = api.socialModuleProfileFindByIdChatFind({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });

  if (isLoading || !data) {
    return <Skeleton />;
  }

  return <ChildComponent {...props} socialModuleChats={data} />;
}

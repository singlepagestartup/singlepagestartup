"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { Skeleton } from "./Skeleton";

export default function Component(props: IComponentProps) {
  const { data, isPending, refetch } = api.socialModuleProfileFindByIdChatFind({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    params: {
      includeSubjectProfiles: props.includeSubjectProfiles,
      includeParticipants: true,
    },
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });

  if (isPending) {
    return <Skeleton language={props.language} compact={props.compact} />;
  }

  if (!data) {
    const ru = props.language === "ru";
    return (
      <div role="alert" className="grid justify-items-start gap-2 p-4 text-sm">
        {ru ? "Не удалось загрузить чаты." : "Could not load chats."}
        <Button variant="outline" onClick={() => void refetch()}>
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  }
  return <ChildComponent {...props} socialModuleChats={data} />;
}

"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { api } from "@sps/rbac/models/subject/sdk/server";

export default async function Component(props: IComponentProps) {
  const data = await api.socialModuleProfileFindByIdChatFind({
    id: props.data.id,
    socialModuleProfileId: props.socialModuleProfile.id,
    options: {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });

  return <ChildComponent {...props} socialModuleChats={data} />;
}

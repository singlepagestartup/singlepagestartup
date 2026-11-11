"use client";
import { api as profileApi } from "@sps/social/models/profile/sdk/client";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default function Client(props: IComponentProps) {
  const author = profileApi.authorFind({
    params: { profileId: props.data.id },
  });
  return <ChildComponent {...props} file={author.data?.[0]?.avatar ?? null} />;
}

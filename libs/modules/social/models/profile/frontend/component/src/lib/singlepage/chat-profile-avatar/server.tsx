"use server";
import "server-only";
import { api as profileApi } from "@sps/social/models/profile/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Server(props: IComponentProps) {
  const authors = await profileApi.authorFind({
    params: { profileId: props.data.id },
  });
  return <ChildComponent {...props} file={authors?.[0]?.avatar ?? null} />;
}

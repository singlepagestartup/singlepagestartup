"use server";
import "server-only";
import { api as profileApi } from "@sps/social/models/profile/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
export default async function Server(props: IComponentProps) {
  if (!props.profileId) return null;
  const result = await profileApi.authorFind({
    params: { profileId: props.profileId },
    options: props.apiProps?.options,
  });
  const data = result?.[0];
  if (!data) return null;
  return <ChildComponent {...props} data={data} />;
}

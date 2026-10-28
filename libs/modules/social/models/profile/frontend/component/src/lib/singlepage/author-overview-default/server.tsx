"use server";
import "server-only";
import { api as profileApi } from "@sps/social/models/profile/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { notFound } from "next/navigation";
export default async function Server(props: IComponentProps) {
  if (!props.profileId) return null;
  const result = await profileApi.authorFindById({
    id: props.profileId || "",
    options: props.apiProps?.options,
  });
  const data = result;
  if (!data) return notFound();
  return <ChildComponent {...props} data={data} />;
}

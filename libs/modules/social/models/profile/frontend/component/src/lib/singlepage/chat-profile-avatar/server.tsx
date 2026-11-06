"use server";
import "server-only";
import { api } from "@sps/social/models/profile/sdk/server";
import type { IComponentProps } from "./interface";
import { Component } from "./Component";

export default async function Server(props: IComponentProps) {
  const authors = await api.authorFind({
    params: { profileId: props.data.id },
  });
  return <Component {...props} file={authors?.[0]?.avatar ?? null} />;
}

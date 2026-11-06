"use client";
import { api } from "@sps/social/models/profile/sdk/client";
import type { IComponentProps } from "./interface";
import { Component } from "./Component";

export default function Client(props: IComponentProps) {
  const author = api.authorFind({ params: { profileId: props.data.id } });
  return <Component {...props} file={author.data?.[0]?.avatar ?? null} />;
}

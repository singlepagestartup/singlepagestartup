"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { cookies } from "next/headers";

async function me(props: IComponentProps) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("rbac.subject.jwt")?.value;

  const headers: HeadersInit = jwt ? { Authorization: `Bearer ${jwt}` } : {};

  const data = await api
    .authenticationMe({
      ...props.apiProps,
      options: {
        ...props.apiProps?.options,
        headers,
        next: {
          revalidate: 0,
          cache: "no-store",
        },
      },
    })
    .catch(() => {
      return;
    });

  return data;
}

export default async function Server(props: IComponentProps) {
  const data = await me(props);

  if (!data) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data });
  }

  return <></>;
}

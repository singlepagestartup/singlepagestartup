"use server";
import "server-only";

import { api } from "@sps/host/models/page/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Server(props: IComponentProps) {
  const data = await api.findByUrl({
    url: props.url,
    catchErrors: true,
    silentErrorStatuses: [404],
  });

  return (
    <ChildComponent
      isServer
      variant={props.variant}
      url={props.url}
      data={data?.routeParams}
    >
      {props.children}
    </ChildComponent>
  );
}

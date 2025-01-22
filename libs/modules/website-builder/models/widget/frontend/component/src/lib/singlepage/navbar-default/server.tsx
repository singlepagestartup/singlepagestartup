"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/website-builder/models/widget/sdk/server";
import { Component } from "./Component";
import { Component as Logotype } from "./assets/logotype";
import { Component as Content } from "./assets/content";

export default async function Server(props: IComponentProps) {
  if (!props.data.id) {
    return <></>;
  }

  const data = await api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  if (!data) {
    return <></>;
  }

  const logotype = (
    <Logotype isServer={props.isServer} variant={props.variant} data={data} />
  );
  const content = (
    <Content isServer={props.isServer} variant={props.variant} data={data} />
  );

  return (
    <Component
      isServer={props.isServer}
      variant={props.variant}
      data={data}
      content={content}
      logotype={logotype}
      children={props.children}
    />
  );
}

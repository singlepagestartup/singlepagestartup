"use server";
import "server-only";

import { IComponentProps } from "./interface";

export default async function Server(props: IComponentProps) {
  if (!props.data.id) {
    return <></>;
  }

  if (props.children) {
    return props.children({ data: "10" });
  }

  return <></>;
}

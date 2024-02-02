"use client";
import "client-only";

import { IComponentProps } from "./interface";
import { api } from "../api/client";
import { variants } from "./variants";

// default is required for dynamic import
export default function Client(props: IComponentProps) {
  const { data, isLoading, isError, isFetching, isUninitialized } =
    api.useFindOneQuery({ id: props.id }, { skip: !props.id });
  // console.log(`🚀 ~ Client ~ props:`, props);

  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp || isError || !data) {
    return <></>;
  }

  return <Comp {...props} {...data} />;
}

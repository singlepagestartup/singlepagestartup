"use server";

import { publicReadOptions } from "@sps/shared-utils/public-read";
import "server-only";

import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentProps } from "./interface";
import { Error } from "./Error";
import { api } from "@sps/broadcast/models/channel/sdk/server";
import { Component as ChildComponent } from "./Component";

export async function Component(props: IComponentProps) {
  try {
    if (!props.data.id) {
      return <></>;
    }

    const data = await api.findById(
      publicReadOptions({
        id: props.data.id,
        ...props.apiProps,
      }),
    );

    if (!data) {
      return <></>;
    }

    return (
      <ErrorBoundary>
        <ChildComponent {...props} data={data} />
      </ErrorBoundary>
    );
  } catch (error) {
    return <></>;
  }
}

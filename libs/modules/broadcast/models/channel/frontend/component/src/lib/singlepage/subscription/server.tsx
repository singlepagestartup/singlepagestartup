"use server";
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

    const data = await api.findById({
      id: props.data.id,
      ...props.apiProps,
    });

    if (!data) {
      return <></>;
    }

    return (
      <ErrorBoundary fallback={Error}>
        <ChildComponent {...props} data={data} />
      </ErrorBoundary>
    );
  } catch (error) {
    return <></>;
  }
}

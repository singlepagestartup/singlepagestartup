import { IComponentPropsExtended } from "./interface";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Component as Server } from "./server";
import { Component as Client } from "./client";
import { Suspense } from "react";
import { Component as Skeleton } from "./Skeleton";
import { Error } from "./Error";

export function Component(props: IComponentPropsExtended) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={<Skeleton />}>
        <Comp {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

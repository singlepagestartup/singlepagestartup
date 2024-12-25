import { Provider } from "@sps/billing/models/currency/sdk/client";
import { IComponentProps } from "./interface";
import { Suspense } from "react";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
import { Component as Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={props.Skeleton ?? <Skeleton />}>
        <Provider>
          <Comp {...props} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

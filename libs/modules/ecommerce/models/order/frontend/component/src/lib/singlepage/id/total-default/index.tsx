import { Provider } from "@sps/ecommerce/models/order/sdk/client";
import { IComponentProps } from "./interface";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Suspense } from "react";
import { Error } from "./Error";
import { Component as Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={<Skeleton />}>
        <Provider>
          <Comp {...props} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

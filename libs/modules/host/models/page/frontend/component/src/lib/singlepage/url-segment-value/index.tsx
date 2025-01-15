import { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { Provider } from "@sps/host/models/page/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Error } from "./Error";
import { Suspense } from "react";
import { Skeleton } from "./Skeleton";

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

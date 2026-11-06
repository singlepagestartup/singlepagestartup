import { Suspense } from "react";
import { Provider } from "@sps/host/models/page/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import type { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  const Reader = props.isServer ? Server : Client;

  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <Provider>
          <Reader {...props} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

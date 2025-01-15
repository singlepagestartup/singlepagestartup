import { Provider } from "@sps/website-builder/models/widget/sdk/client";
import { IComponentProps } from "./interface";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Error } from "./Error";
import Server from "./server";
import Client from "./client";
import { Skeleton } from "./Skeleton";
import { Suspense } from "react";

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

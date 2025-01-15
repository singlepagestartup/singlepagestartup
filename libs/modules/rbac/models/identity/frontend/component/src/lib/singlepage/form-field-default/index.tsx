import { Provider as ApiProvider } from "@sps/rbac/models/identity/sdk/client";
import { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { Skeleton } from "./Skeleton";
import { Suspense } from "react";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Error } from "./Error";

export function Component(props: IComponentProps) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={<Skeleton />}>
        <ApiProvider>
          <Comp {...props} />
        </ApiProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

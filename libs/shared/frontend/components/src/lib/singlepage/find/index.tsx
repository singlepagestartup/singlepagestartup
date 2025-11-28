import { ReactNode, Suspense } from "react";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import {
  Provider as ParentProvider,
  factory as clientFactory,
} from "@sps/shared-frontend-client-api";
import { factory as serverFactory } from "@sps/shared-frontend-server-api";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Error } from "./Error";
import { Component as Server } from "./server";
import { Component as Client } from "./client";
import { Component as Skeleton } from "./Skeleton";

export function Component<M, V>(
  props: IComponentProps<M, V> & {
    Provider: typeof ParentProvider;
    Skeleton?: ReactNode;
    Component?: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
    clientApi: ReturnType<typeof clientFactory<M>>;
    serverApi: ReturnType<typeof serverFactory<M>>;
  },
) {
  const Comp: any = props.isServer ? Server : Client;
  const api = props.isServer ? props.serverApi : props.clientApi;
  const Provider = props.Provider;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={props.Skeleton ?? <Skeleton />}>
        <Provider>
          <Comp {...props} api={api} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

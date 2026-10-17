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

export function Component<
  M extends { id: string },
  V,
  CP extends IComponentProps<M, V>,
>(
  props: CP & {
    Provider: typeof ParentProvider;
    Skeleton?: ReactNode;
    Component: React.ComponentType<
      Omit<
        IComponentPropsExtended<M, V, CP>,
        | "Component"
        | "Provider"
        | "clientApi"
        | "serverApi"
        | "api"
        | "Skeleton"
      >
    >;
    clientApi: ReturnType<typeof clientFactory<M>>;
    serverApi: ReturnType<typeof serverFactory<M>>;
    api?: unknown;
    children?: ReactNode;
  },
) {
  if (props.dataSource === "props") {
    const {
      Component: ChildComponent,
      Provider: _Provider,
      clientApi: _clientApi,
      serverApi: _serverApi,
      api: _api,
      Skeleton: _Skeleton,
      ...viewProps
    } = props;
    return <ChildComponent {...viewProps} data={props.data} />;
  }

  const Comp: any = props.isServer ? Server : Client;
  const api = props.isServer ? props.serverApi : props.clientApi;
  const Provider = props.Provider;

  return (
    <ErrorBoundary>
      <Suspense fallback={props.Skeleton ?? <Skeleton />}>
        <Provider>
          <Comp {...props} api={api} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

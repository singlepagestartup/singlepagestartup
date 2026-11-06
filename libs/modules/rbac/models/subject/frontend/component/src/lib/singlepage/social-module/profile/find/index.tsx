import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Suspense } from "react";
import type { IComponentProps } from "./interface";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
export function Component(props: IComponentProps) {
  const Reader = props.isServer ? Server : Client;
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Provider>
          <Reader {...props} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

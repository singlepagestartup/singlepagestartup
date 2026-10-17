import { Suspense } from "react";
import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "../forgot-password-form-default/Skeleton";
import Client from "./client";
import Server from "./server";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const Child = props.isServer ? Server : Client;
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <Provider>
          <Child {...props} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}
export { type IModel } from "@sps/rbac/models/subject/sdk/model";

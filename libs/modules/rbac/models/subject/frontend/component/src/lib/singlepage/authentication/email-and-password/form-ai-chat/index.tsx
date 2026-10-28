import { Suspense } from "react";
import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Skeleton } from "../authentication-form-default/Skeleton";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton />}>
        <Provider>
          <ChildComponent
            language={props.language}
            isServer={props.isServer}
            variant={props.variant}
            mode={props.mode}
          />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

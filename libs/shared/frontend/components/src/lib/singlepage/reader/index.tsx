import { Suspense } from "react";
import { ErrorBoundary, type ISpsComponentBase } from "@sps/ui-adapter";

import type { IComponentProps } from "./interface";
import { Component as Skeleton } from "../default/Skeleton";

/** Boundary for local SDK readers whose operation is not find or findById. */
export function Component<P extends ISpsComponentBase>(
  props: IComponentProps<P>,
) {
  const { Component: Reader, Provider, componentProps } = props;
  const skeleton = componentProps.skeleton ?? <Skeleton />;

  return (
    <ErrorBoundary>
      <Suspense fallback={skeleton}>
        <Provider>
          <Reader {...componentProps} />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}

import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentPropsExtended } from "./interface";
import { Component as Server } from "./server";
import { Component as Client } from "./client";
import { Component as Skeleton } from "./Skeleton";
import { Component as Error } from "./Error";

export function Component<M extends { id?: string }>(
  props: IComponentPropsExtended<M> & { Skeleton?: ReactNode },
) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <ErrorBoundary fallback={Error}>
      <Suspense fallback={props.Skeleton ?? <Skeleton />}>
        <Comp {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

import {
  Provider,
  api as clientApi,
} from "@sps/website-builder/models/widget/sdk/client";
import { api as serverApi } from "@sps/website-builder/models/widget/sdk/server";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent as any}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      Skeleton={<Skeleton />}
      {...props}
    />
  );
}

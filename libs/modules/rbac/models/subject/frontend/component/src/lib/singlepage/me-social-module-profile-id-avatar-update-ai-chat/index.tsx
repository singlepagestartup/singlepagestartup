import { Skeleton } from "./Skeleton";
import {
  Provider,
  api as clientApi,
} from "@sps/rbac/models/subject/sdk/client";
import { api as serverApi } from "@sps/rbac/models/subject/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/subject-default";
import Client from "./client";
import Server from "./server";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
      Skeleton={props.skeleton ?? <Skeleton />}
      skeleton={props.skeleton ?? <Skeleton />}
    />
  );
}

export { type IModel } from "@sps/rbac/models/subject/sdk/model";

"use server";
import "server-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps, variant, IModel } from "./interface";
import { api } from "@sps/rbac/relations/subjects-to-ecommerce-orders/sdk/server";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table/client";

// default is required for dynamic import
export default async function Server(props: IComponentProps) {
  return (
    <ParentComponent<IModel, typeof variant, any, IComponentProps>
      Error={Error}
      Skeleton={Skeleton}
      Component={Component}
      api={api}
      {...props}
    />
  );
}
"use server";
import "server-only";

import { IComponentProps, variant, IModel } from "./interface";
import { Error } from "./Error";
import { api } from "@sps/website-builder/models/modal/sdk/server";
import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default/server";

export default async function Server(props: IComponentProps) {
  return (
    <ParentComponent<IModel, typeof variant, any, IComponentProps>
      Error={Error}
      Skeleton={<Skeleton />}
      Component={Component}
      api={api}
      {...props}
    />
  );
}

"use client";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { IComponentProps, variant, IModel } from "./interface";
import { api } from "@sps/file-storage/models/widget/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find/client";

export default function Client(props: IComponentProps) {
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

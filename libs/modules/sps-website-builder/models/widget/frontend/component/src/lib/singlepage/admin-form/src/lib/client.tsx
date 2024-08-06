"use client";
import "client-only";

import { IComponentProps, variant, IModel } from "./interface";
import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { Error } from "./Error";
import { api } from "@sps/sps-website-builder/models/widget/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-form/client";

export default function Client(props: IComponentProps) {
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

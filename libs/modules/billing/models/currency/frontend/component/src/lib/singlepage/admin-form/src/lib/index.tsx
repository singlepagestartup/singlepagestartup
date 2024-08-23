import { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { Skeleton } from "./Skeleton";
import { Provider as ApiProvider } from "@sps/billing/models/currency/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Client={Client}
      Server={Server}
      Skeleton={Skeleton}
      Provider={ApiProvider}
      {...props}
    />
  );
}

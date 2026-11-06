import { Provider } from "@sps/host/models/page/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import Client from "./client";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={Client}
      Provider={Provider}
      componentProps={props}
    />
  );
}

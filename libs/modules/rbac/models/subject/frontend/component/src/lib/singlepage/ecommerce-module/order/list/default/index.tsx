import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import type { IComponentProps } from "./interface";
import { Component as Client } from "./client";
import { Component as Server } from "./server";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={props}
    />
  );
}

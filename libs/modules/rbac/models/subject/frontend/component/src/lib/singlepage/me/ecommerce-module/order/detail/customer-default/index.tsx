import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import { Component as Client } from "./client";
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

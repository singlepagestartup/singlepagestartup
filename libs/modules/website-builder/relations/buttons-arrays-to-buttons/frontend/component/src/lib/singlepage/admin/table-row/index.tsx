import {
  Provider,
  api as clientApi,
} from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/client";
import { api as serverApi } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table-row";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}

import {
  Provider,
  api as clientApi,
} from "@sps/crm/relations/widgets-to-forms/sdk/client";
import { api as serverApi } from "@sps/crm/relations/widgets-to-forms/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input";
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

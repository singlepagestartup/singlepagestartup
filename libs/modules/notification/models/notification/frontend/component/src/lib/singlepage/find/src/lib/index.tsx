import {
  Provider,
  api as clientApi,
} from "@sps/notification/models/notification/sdk/client";
import { api as serverApi } from "@sps/notification/models/notification/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find2";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}

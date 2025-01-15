import {
  Provider,
  api as clientApi,
} from "@sps/file-storage/models/widget/sdk/client";
import { api as serverApi } from "@sps/file-storage/models/widget/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find";

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
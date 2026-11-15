import {
  Provider,
  api as clientApi,
} from "@sps/social/models/skill/sdk/client";
import { api as serverApi } from "@sps/social/models/skill/sdk/server";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
      dataSource={props.dataSource ?? "props"}
    />
  );
}

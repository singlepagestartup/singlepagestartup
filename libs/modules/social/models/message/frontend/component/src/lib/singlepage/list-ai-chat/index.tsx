import {
  Provider,
  api as clientApi,
} from "@sps/social/models/message/sdk/client";
import { api as serverApi } from "@sps/social/models/message/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    >
      {({ data }) => <ChildComponent {...props} data={data || []} />}
    </ParentComponent>
  );
}

export { type IModel } from "@sps/social/models/message/sdk/model";

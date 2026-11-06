import {
  Provider,
  api as clientApi,
} from "@sps/social/models/profile/sdk/client";
import { api as serverApi } from "@sps/social/models/profile/sdk/server";
import type { IModel } from "@sps/social/models/profile/sdk/model";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";
export function Component(props: IComponentProps) {
  const id = props.data?.id || props.profileId;
  if (!id) return null;
  return (
    <ParentComponent
      {...props}
      data={props.data ?? ({ id } as IModel)}
      Skeleton={props.skeleton ?? <Skeleton />}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
    />
  );
}

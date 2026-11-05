import { Provider } from "@sps/social/models/profile/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";
import Client from "./client";
import Server from "./server";
export function Component(props: IComponentProps) {
  if (props.dataSource === "props" && props.data)
    return <ChildComponent {...props} data={props.data} />;
  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={{ ...props, skeleton: props.skeleton ?? <Skeleton /> }}
    />
  );
}

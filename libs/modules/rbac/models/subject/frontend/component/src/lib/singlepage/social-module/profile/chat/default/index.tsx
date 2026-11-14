import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import Client from "./client";
import Server from "./server";
import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import { Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  if (props.dataSource === "props") {
    if (!props.socialModuleChat) {
      return null;
    }
    return (
      <ParentComponent
        dataSource="props"
        Component={ChildComponent}
        componentProps={{ ...props, socialModuleChat: props.socialModuleChat }}
      />
    );
  }

  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={{ ...props, skeleton: props.skeleton ?? <Skeleton /> }}
    />
  );
}

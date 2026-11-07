import { Provider } from "@sps/social/models/profile/sdk/client";
import { Component as Reader } from "@sps/shared-frontend-components/singlepage/reader";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import Client from "./client";
import Server from "./server";

export function Component(props: IComponentProps) {
  if (props.file !== undefined || props.data.id === "unknown") {
    return <ChildComponent {...props} />;
  }
  return (
    <Reader
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={{ ...props, skeleton: props.fallback }}
    />
  );
}

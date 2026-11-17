import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { Component as Reader } from "@sps/shared-frontend-components/singlepage/reader";
import Client from "./client";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <Reader
      Component={Client}
      Provider={Provider}
      componentProps={{
        isServer: false,
        variant: props.variant,
        children: props.children,
      }}
    />
  );
}

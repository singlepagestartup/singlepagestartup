import {
  Provider,
  api as clientApi,
} from "@sps/file-storage/models/file/sdk/client";
import { api as serverApi } from "@sps/file-storage/models/file/sdk/server";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import Client from "./client";
import type { IComponentProps } from "./interface";

function LoadedComponent(props: IComponentProps) {
  return (
    <Client
      data={props.data}
      variant={props.variant}
      language={props.language}
    />
  );
}

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={LoadedComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
export { type IModel } from "@sps/file-storage/models/file/sdk/model";

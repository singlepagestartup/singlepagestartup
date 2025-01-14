import {
  Provider,
  api as clientApi,
} from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/client";
import { api as serverApi } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/server";
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

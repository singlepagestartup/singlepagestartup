import {
  Provider,
  api as clientApi,
} from "@sps/website-builder/relations/widgets-to-sliders/sdk/client";
import { api as serverApi } from "@sps/website-builder/relations/widgets-to-sliders/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find2";

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

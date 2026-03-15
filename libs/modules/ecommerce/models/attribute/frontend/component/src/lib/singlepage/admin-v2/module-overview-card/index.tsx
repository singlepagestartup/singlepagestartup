import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "./Component";
import { Provider } from "@sps/ecommerce/models/attribute/sdk/client";

export function Component(props: IComponentProps) {
  return (
    <Provider>
      <ParentComponent {...props} />
    </Provider>
  );
}

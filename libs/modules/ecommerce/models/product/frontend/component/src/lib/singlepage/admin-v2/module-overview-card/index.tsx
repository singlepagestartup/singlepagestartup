import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "./Component";
import { Provider } from "@sps/ecommerce/models/product/sdk/client";

export function Component(props: IComponentProps) {
  return (
    <Provider>
      <ParentComponent {...props} />
    </Provider>
  );
}

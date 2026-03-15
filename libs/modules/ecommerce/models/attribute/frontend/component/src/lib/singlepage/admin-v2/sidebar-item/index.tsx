import { IComponentProps } from "./interface";
import { Provider } from "@sps/ecommerce/models/attribute/sdk/client";
import { Component as Comp } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <Provider>
      <Comp {...props} />
    </Provider>
  );
}

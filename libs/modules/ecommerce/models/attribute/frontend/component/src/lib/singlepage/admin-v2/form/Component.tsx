import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { Provider } from "@sps/ecommerce/models/attribute/sdk/client";

export function Component(props: IComponentPropsExtended) {
  return (
    <Provider>
      <ClientComponent {...props} />
    </Provider>
  );
}

import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { Provider } from "@sps/ecommerce/relations/products-to-attributes/sdk/client";

export function Component(props: IComponentPropsExtended) {
  return (
    <Provider>
      <ClientComponent {...props} />
    </Provider>
  );
}

import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Widget } from "./widget/Component";
import { Component as Product } from "./product/Component";
import { Component as Store } from "./store/Component";
import { Component as Category } from "./category/Component";
import { Component as Attribute } from "./attribute/Component";
import { Component as AttributeKey } from "./attribute-key/Component";
import { Component as Order } from "./order/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "product",
      Comp: Product,
    },
    {
      name: "store",
      Comp: Store,
    },
    {
      name: "category",
      Comp: Category,
    },
    {
      name: "attribute",
      Comp: Attribute,
    },
    {
      name: "attribute-key",
      Comp: AttributeKey,
    },
    {
      name: "order",
      Comp: Order,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="ecommerce"
    />
  );
}

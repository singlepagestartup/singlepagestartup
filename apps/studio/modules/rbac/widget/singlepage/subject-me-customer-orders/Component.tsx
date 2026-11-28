import type { IComponentProps } from "./interface";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as Subject } from "../../../subject";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-customer-orders"
    >
      <WebsiteBuilderModuleWidget
        variant="content-ecommerce-default"
        title="Заказы"
      >
        <Subject
          variant="me-ecommerce-module-order-list-customer-default"
          orders={props.orders}
          detailHrefs={props.detailHrefs}
        />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}

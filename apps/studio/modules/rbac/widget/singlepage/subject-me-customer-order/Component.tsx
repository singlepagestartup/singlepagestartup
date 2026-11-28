import type { IComponentProps } from "./interface";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as Subject } from "../../../subject";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-customer-order"
    >
      <WebsiteBuilderModuleWidget
        variant="content-ecommerce-default"
        title="Заказ"
      >
        <Subject
          variant="me-ecommerce-module-order-detail-customer-default"
          order={props.order}
          discussion={props.discussion}
        />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}

"use client";

import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Widget } from "./widget/Component";
import { Component as PaymentIntent } from "./payment-intent/Component";
import { Component as Invoice } from "./invoice/Component";
import { Component as Currency } from "./currency/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "payment-intent",
      Comp: PaymentIntent,
    },
    {
      name: "invoice",
      Comp: Invoice,
    },
    {
      name: "currency",
      Comp: Currency,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="billing"
    />
  );
}

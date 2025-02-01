import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Widget } from "./widget/Component";
import { Component as Form } from "./form/Component";
import { Component as Input } from "./input/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "form",
      Comp: Form,
    },
    {
      name: "input",
      Comp: Input,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="crm"
    />
  );
}

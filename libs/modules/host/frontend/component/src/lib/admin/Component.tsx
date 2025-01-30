import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Widget } from "./widget/Component";
import { Component as Page } from "./page/Component";
import { Component as Layout } from "./layout/Component";
import { Component as Metadata } from "./metadata/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "page",
      Comp: Page,
    },
    {
      name: "layout",
      Comp: Layout,
    },
    {
      name: "metadata",
      Comp: Metadata,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="host"
    />
  );
}

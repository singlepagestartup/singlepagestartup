import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Profile } from "./profile/Component";
import { Component as Widget } from "./widget/Component";
import { Component as Attribute } from "./attribute/Component";
import { Component as AttributeKey } from "./attribute-key/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "profile",
      Comp: Profile,
    },
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "attribute",
      Comp: Attribute,
    },
    {
      name: "attribute-key",
      Comp: AttributeKey,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="social"
    />
  );
}

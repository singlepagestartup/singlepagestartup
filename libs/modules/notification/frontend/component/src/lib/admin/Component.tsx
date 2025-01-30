import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Widget } from "./widget/Component";
import { Component as Notification } from "./notification/Component";
import { Component as Topic } from "./topic/Component";
import { Component as Template } from "./template/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: Widget,
    },
    {
      name: "notification",
      Comp: Notification,
    },
    {
      name: "topic",
      Comp: Topic,
    },
    {
      name: "template",
      Comp: Template,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="notification"
    />
  );
}

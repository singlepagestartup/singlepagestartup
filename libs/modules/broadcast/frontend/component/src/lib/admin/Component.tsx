import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/panel/Component";
import { Component as Channel } from "./channel/Component";
import { Component as Message } from "./message/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "channel",
      Comp: Channel,
    },
    {
      name: "message",
      Comp: Message,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="@sps/broadcast"
    />
  );
}

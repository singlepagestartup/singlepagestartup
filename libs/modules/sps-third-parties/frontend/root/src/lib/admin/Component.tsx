import { IComponentProps } from "./interface";
import { Component as WidgetSpsLiteAdminTable } from "@sps/sps-third-parties/models/widget/frontend/component/variants/sps-lite/admin-table";
import { Component as TelegarmSpsLiteAdminTable } from "@sps/sps-third-parties/models/telegram/frontend/component/variants/sps-lite/admin-table";
import { Component as ParentComponent } from "@sps/shared-frontend-components/sps-lite/admin/admin-panel/Component";

export function Component(props: IComponentProps) {
  const models = [
    {
      name: "widget",
      Comp: WidgetSpsLiteAdminTable,
    },
    {
      name: "telegram",
      Comp: TelegarmSpsLiteAdminTable,
    },
  ];

  return (
    <ParentComponent
      isServer={props.isServer}
      models={models}
      name="admin-panel"
      module="sps-third-parties"
    />
  );
}

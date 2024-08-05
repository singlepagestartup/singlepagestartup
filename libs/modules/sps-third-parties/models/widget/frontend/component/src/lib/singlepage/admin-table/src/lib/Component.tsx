import { IComponentPropsExtended } from "./interface";
import { Component as AdminTableRow } from "../../../admin-table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent
      module="sps-third-parties"
      name="widget"
      variant={props.variant}
      adminForm={
        props.adminForm
          ? props.adminForm({
              hostUrl: props.hostUrl,
              isServer: props.isServer,
            })
          : null
      }
    >
      <div className="flex flex-col gap-6 pt-8 p-4">
        {props.data.map((entity, index) => {
          return (
            <AdminTableRow
              key={index}
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant="admin-table-row"
              adminForm={props.adminForm}
              data={entity}
            />
          );
        })}
      </div>
    </ParentComponent>
  );
}

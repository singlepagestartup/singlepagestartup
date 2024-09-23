import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminForm } from "../../../admin-form";
import { Component as AdminTableRow } from "../../../admin-table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table2/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="host"
      name="pages-to-layouts"
      type="relation"
      variant={props.variant}
      adminForm={
        <AdminForm
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-form"
        />
      }
    >
      <div className="flex flex-col gap-6 pt-8 p-4">
        {props.data.map((entity, index) => {
          return (
            <AdminTableRow
              key={index}
              module="host"
              name="pages-to-layouts"
              type="relation"
              isServer={props.isServer}
              hostUrl={props.hostUrl}
              variant="admin-table-row"
              data={entity}
            />
          );
        })}
      </div>
    </ParentComponent>
  );
}

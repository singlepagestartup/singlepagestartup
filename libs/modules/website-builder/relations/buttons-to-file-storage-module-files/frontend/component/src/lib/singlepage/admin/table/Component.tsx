import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminForm } from "../form";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="website-builder"
      name="buttons-to-file-storage-module-files"
      type="relation"
      variant={props.variant}
      adminForm={<AdminForm isServer={props.isServer} variant="admin-form" />}
    >
      <div className="flex flex-col gap-6 pt-8 p-4">
        {props.data.map((entity, index) => {
          return (
            <AdminTableRow
              key={index}
              module="website-builder"
              name="buttons-to-file-storage-module-files"
              type="relation"
              isServer={props.isServer}
              variant="admin-table-row"
              data={entity}
            />
          );
        })}
      </div>
    </ParentComponent>
  );
}

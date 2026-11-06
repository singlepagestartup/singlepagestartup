import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="social"
      name="profiles-to-blog-module-articles"
    >
      <div className="flex flex-col gap-6 p-4">
        {props.data.map((entity) => (
          <AdminTableRow
            key={entity.id}
            module="social"
            name="profiles-to-blog-module-articles"
            isServer={false}
            variant="admin-table-row"
            data={entity}
            adminForm={props.adminForm}
          />
        ))}
      </div>
    </ParentComponent>
  );
}

import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="social"
      name="skill"
      variant={props.variant}
    >
      {props.data.map((entity) => {
        return (
          <AdminTableRow
            key={entity.id}
            module="social"
            name="skill"
            isServer={props.isServer}
            variant="admin-table-row"
            adminForm={props.adminForm}
            data={entity}
          />
        );
      })}
    </ParentComponent>
  );
}

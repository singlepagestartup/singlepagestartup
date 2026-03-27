import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant> {...props}>
      {props.data.map((entity, index) => {
        return (
          <AdminTableRow
            key={index}
            module="website-builder"
            name="button"
            isServer={false}
            variant="admin-v2-table-row"
            adminForm={props.adminForm}
            data={entity}
          />
        );
      })}
    </ParentComponent>
  );
}

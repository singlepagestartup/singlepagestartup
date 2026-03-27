import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant> {...props}>
      {props.data.map((entity, index) => {
        return (
          <AdminTableRow
            key={entity.id || String(index)}
            module="ecommerce"
            name="stores-to-orders"
            isServer={props.isServer}
            variant="admin-v2-table-row"
            data={entity}
            apiProps={props.apiProps}
            leftModelAdminForm={props.leftModelAdminForm}
            rightModelAdminForm={props.rightModelAdminForm}
            leftModelAdminFormLabel={props.leftModelAdminFormLabel}
            rightModelAdminFormLabel={props.rightModelAdminFormLabel}
          />
        );
      })}
    </ParentComponent>
  );
}

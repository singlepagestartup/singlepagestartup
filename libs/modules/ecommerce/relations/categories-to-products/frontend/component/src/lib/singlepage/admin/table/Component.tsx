import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminForm } from "../form";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="categories-to-products"
      variant={props.variant}
      adminForm={<AdminForm isServer={props.isServer} variant="admin-form" />}
    >
      <div className="flex flex-col gap-6 pt-8 p-4">
        {props.data.map((entity, index) => {
          return (
            <AdminTableRow
              key={index}
              module="ecommerce"
              name="categories-to-products"
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

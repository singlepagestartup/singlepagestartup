import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant> {...props}>
      {props.data.map((entity, index) => {
        return (
          <AdminTableRow
            key={index}
            module="blog"
            name="categories-to-website-builder-module-widgets"
            isServer={props.isServer}
            variant="admin-table-row"
            data={entity}
          />
        );
      })}
    </ParentComponent>
  );
}

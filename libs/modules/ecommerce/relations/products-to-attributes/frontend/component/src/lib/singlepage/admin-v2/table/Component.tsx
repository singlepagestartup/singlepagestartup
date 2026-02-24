import { IComponentPropsExtended, IModel, variant } from "./interface";
import { Component as AdminTableRow } from "../table-row";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      {props.data.map((entity, index) => {
        return (
          <AdminTableRow
            key={index}
            module="ecommerce"
            name="products-to-attributes"
            isServer={props.isServer}
            variant="admin-v2-table-row"
            data={{ id: String(entity.id || "") }}
          />
        );
      })}
    </>
  );
}

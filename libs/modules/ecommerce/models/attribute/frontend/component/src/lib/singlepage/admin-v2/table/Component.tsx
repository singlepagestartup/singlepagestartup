import { IComponentPropsExtended } from "./interface";
import { Component as AdminTableRow } from "../table-row";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      {!props.data.length ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-20 text-center text-4xl text-muted-foreground/60">
          No found items.
        </div>
      ) : null}
      {props.data.map((entity) => {
        return (
          <AdminTableRow
            key={entity.id}
            module="ecommerce"
            name="attribute"
            isServer={props.isServer}
            variant="admin-v2-table-row"
            adminForm={props.adminForm}
            data={entity}
          />
        );
      })}
    </>
  );
}

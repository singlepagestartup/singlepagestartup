import { IComponentPropsExtended, IModel, variant } from "./interface";
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
        const defaultTitle =
          entity.title && typeof entity.title === "object"
            ? String((entity.title as Record<string, unknown>).en || "")
            : "";
        const defaultShortDescription =
          entity.shortDescription && typeof entity.shortDescription === "object"
            ? String(
                (entity.shortDescription as Record<string, unknown>).en || "",
              )
            : "";

        return (
          <AdminTableRow
            key={entity.id || defaultTitle}
            module="ecommerce"
            name="product"
            isServer={props.isServer}
            variant="admin-v2-table-row"
            adminForm={props.adminForm}
            data={{ id: String(entity.id || "") }}
          />
        );
      })}
    </>
  );
}

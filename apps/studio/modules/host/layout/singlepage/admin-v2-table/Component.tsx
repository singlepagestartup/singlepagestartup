import type { IComponentProps } from "./interface";
import { memo } from "react";
import fixture from "./data.json";
import type { IRecord } from "./interface";
function FieldValue({
  field,
  value,
}: {
  field: { key: string; target?: { module: string; entity: string } };
  value: unknown;
}) {
  if (!field.target || !value) return <>{valueLabel(value)}</>;
  const story = `modules-${field.target.module}-models-${field.target.entity}-singlepage-admin-v2-card--default`;
  return (
    <a
      href={`/?path=/story/${story}&args=id:${encodeURIComponent(String(value))}`}
      target="_top"
      className="underline underline-offset-4"
    >
      {field.target.module}.{field.target.entity} · {valueLabel(value)}
    </a>
  );
}
function valueLabel(value: unknown): string {
  return value == null
    ? "—"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
}

export function Component({
  variant = "admin-v2-table",
  empty = false,
}: IComponentProps) {
  const records = empty ? [] : fixture.records;
  return (
    <section
      className="min-w-0 p-5 sm:p-6"
      data-module="host"
      data-model="layout"
      data-variant={variant}
    >
      <p className="text-xs text-muted-foreground">
        {fixture.schema.module} / {fixture.schema.entityType} /{" "}
        {fixture.schema.entity}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{fixture.schema.entity}</h2>
      <div className="mt-5 max-w-full overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left">
          <thead className="bg-muted">
            <tr>
              {fields.map((field) => (
                <th
                  scope="col"
                  key={field.key}
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground"
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <Row key={record.id} record={record} />
            ))}
          </tbody>
        </table>
        {!records.length && (
          <p role="status" className="p-5">
            No records to display.
          </p>
        )}
      </div>
    </section>
  );
}
const fields = fixture.schema.fields;
const Row = memo(function Row({ record }: { record: IRecord }) {
  return (
    <tr className="border-t border-border">
      {fields.map((field) => (
        <td
          key={field.key}
          className="max-w-xs px-4 py-3 align-top text-sm [overflow-wrap:anywhere]"
        >
          <FieldValue
            field={field}
            value={record[field.key as keyof IRecord]}
          />
        </td>
      ))}
    </tr>
  );
});

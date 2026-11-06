import type { IComponentProps } from "./interface";
import { memo } from "react";
import fixture from "../admin-v2-table/data.json";
import type { IRecord } from "../admin-v2-table/interface";
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

function Card({
  variant = "admin-v2-card",
  id,
  data,
  className,
}: IComponentProps) {
  const record =
    data ??
    (id ? fixture.records.find((item) => item.id === id) : fixture.records[0]);
  if (!record)
    return (
      <p
        data-module="website-builder"
        data-model="feature"
        data-variant={variant}
      >
        Record unavailable in this local preview.
      </p>
    );
  return (
    <article
      className={`min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6 ${className ?? ""}`}
      data-module="website-builder"
      data-model="feature"
      data-variant={variant}
    >
      <p className="text-xs text-muted-foreground">
        {fixture.schema.module} / {fixture.schema.entityType}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{fixture.schema.entity}</h2>
      <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{field.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
              <FieldValue
                field={field}
                value={record[field.key as keyof IRecord]}
              />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
const fields = fixture.schema.fields;
export const Component = memo(Card);

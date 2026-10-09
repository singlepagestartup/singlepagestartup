import { memo, useMemo } from "react";
import { Records, type IRecordField } from "./Records";
import { kit } from "./primitives";

export interface IProjectionField {
  key: string;
  label: string;
  kind: string;
  nullable: boolean;
  target?: { module: string; entity: string };
}

export interface IProjectionSchema {
  module: string;
  entity: string;
  entityType: string;
  fields: IProjectionField[];
}

export interface IProjectionProps<T extends { id: string }> {
  id?: string;
  data?: T;
  className?: string;
}

export interface IProjectionListProps<T extends { id: string }> {
  data?: T[];
  count?: number;
  empty?: boolean;
  className?: string;
}

function valueLabel(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function RelatedValue({
  field,
  value,
}: {
  field: IProjectionField;
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

export function RecordTable<T extends { id: string }>({
  schema,
  data,
}: {
  schema: IProjectionSchema;
  data: T[];
}) {
  const fields = useMemo<IRecordField<T>[]>(
    () =>
      schema.fields.map((field) => ({
        key: field.key,
        label: field.label,
        value: (record) => valueLabel(record[field.key as keyof T]),
        renderValue: (record) => (
          <RelatedValue field={field} value={record[field.key as keyof T]} />
        ),
      })),
    [schema],
  );
  return (
    <Records
      scope={`${schema.module} / ${schema.entityType} / ${schema.entity}`}
      title={schema.entity}
      records={data}
      fields={fields}
      actions={[]}
    />
  );
}

function RecordCardView<T extends { id: string }>({
  schema,
  data,
  className,
}: {
  schema: IProjectionSchema;
  data: T;
  className?: string;
}) {
  return (
    <article className={`${kit.card} min-w-0 p-5 sm:p-6 ${className ?? ""}`}>
      <p className={`text-xs ${kit.muted}`}>
        {schema.module} / {schema.entityType}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{schema.entity}</h2>
      <dl className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {schema.fields.map((field) => (
          <div key={field.key} className="min-w-0">
            <dt className={`text-xs ${kit.muted}`}>{field.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
              <RelatedValue field={field} value={data[field.key as keyof T]} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
export const RecordCard = memo(RecordCardView) as typeof RecordCardView;

export function RecordList<T extends { id: string }>({
  schema,
  records,
  count = 3,
  empty = false,
  className,
}: IProjectionListProps<T> & { schema: IProjectionSchema; records: T[] }) {
  const length =
    empty || !records.length || !Number.isFinite(count)
      ? 0
      : Math.max(0, Math.floor(count));
  if (!length)
    return (
      <p role="status" className="p-5">
        No records to display.
      </p>
    );
  return (
    <div className={`grid min-w-0 gap-4 p-4 sm:grid-cols-2 ${className ?? ""}`}>
      {Array.from({ length }, (_, index) => (
        <RecordCard
          key={`${records[0].id}:${index}`}
          schema={schema}
          data={records[0]}
        />
      ))}
    </div>
  );
}

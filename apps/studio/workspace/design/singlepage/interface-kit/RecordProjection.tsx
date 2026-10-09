import { memo, useMemo, type ReactNode } from "react";
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

export interface IProjectionFindProps<T extends { id: string }> {
  apiProps?: {
    params?: {
      filters?: {
        and?: Array<{
          column: keyof T;
          method: "eq" | "ne" | "in" | "notIn" | "like" | "ilike";
          value: unknown;
        }>;
      };
    };
  };
  children?: (props: { data: T[] }) => ReactNode;
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

export function RecordFind<T extends { id: string }>({
  schema,
  records,
  apiProps,
  children,
}: IProjectionFindProps<T> & { schema: IProjectionSchema; records: T[] }) {
  const data = useMemo(() => {
    const filters = apiProps?.params?.filters?.and ?? [];
    return records.filter((record) =>
      filters.every((filter) => {
        const actual = record[filter.column];
        if (filter.method === "eq") return actual === filter.value;
        if (filter.method === "ne") return actual !== filter.value;
        if (filter.method === "in")
          return Array.isArray(filter.value) && filter.value.includes(actual);
        if (filter.method === "notIn")
          return Array.isArray(filter.value) && !filter.value.includes(actual);
        const text = String(actual ?? "");
        const pattern = String(filter.value ?? "")
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/%/g, ".*")
          .replace(/_/g, ".");
        return new RegExp(
          `^${pattern}$`,
          filter.method === "ilike" ? "i" : "",
        ).test(text);
      }),
    );
  }, [records, apiProps]);
  return (
    <>
      {children ? (
        children({ data })
      ) : (
        <RecordTable schema={schema} data={data} />
      )}
    </>
  );
}

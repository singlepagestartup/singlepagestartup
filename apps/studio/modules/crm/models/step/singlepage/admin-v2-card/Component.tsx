import {
  RecordCard,
  type IProjectionProps,
} from "../../../../../../workspace/design/singlepage/interface-kit/RecordProjection";
import fixture from "../admin-v2-table/data.json";
import type { IRecord } from "../admin-v2-table/interface";

export interface IComponentProps extends IProjectionProps<IRecord> {}

export function Component({ data, id, className }: IComponentProps) {
  const record =
    data ??
    (id ? fixture.records.find((item) => item.id === id) : fixture.records[0]);
  if (!record) return <p>Record unavailable in this local preview.</p>;
  return (
    <RecordCard schema={fixture.schema} data={record} className={className} />
  );
}

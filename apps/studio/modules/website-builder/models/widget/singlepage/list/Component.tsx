import {
  RecordList,
  type IProjectionListProps,
} from "../../../../../../workspace/design/singlepage/interface-kit/RecordProjection";
import fixture from "../admin-v2-table/data.json";
import type { IRecord } from "../admin-v2-table/interface";

export interface IComponentProps extends IProjectionListProps<IRecord> {}
export function Component({
  data = fixture.records,
  ...props
}: IComponentProps) {
  return (
    <RecordList<IRecord> schema={fixture.schema} records={data} {...props} />
  );
}

import {
  RecordFind,
  type IProjectionFindProps,
} from "../../../../../../workspace/design/singlepage/interface-kit/RecordProjection";
import fixture from "../admin-v2-table/data.json";
import type { IRecord } from "../admin-v2-table/interface";

export interface IComponentProps extends IProjectionFindProps<IRecord> {}

export function Component(props: IComponentProps) {
  return (
    <RecordFind<IRecord>
      schema={fixture.schema}
      records={fixture.records}
      {...props}
    />
  );
}

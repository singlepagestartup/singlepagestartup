import { RecordTable } from "../../../../../../workspace/design/singlepage/interface-kit/RecordProjection";
import fixture from "./data.json";
import type { IRecord } from "./interface";

export interface IComponentProps {
  empty?: boolean;
}
export function Component({ empty = false }: IComponentProps) {
  return (
    <RecordTable<IRecord>
      schema={fixture.schema}
      data={empty ? [] : fixture.records}
    />
  );
}

import { RecordTable } from "../../../../../../workspace/design/singlepage/interface-kit/RecordProjection";
import fixture from "./data.json";
import type { IRecord } from "./interface";

export function Component() {
  return (
    <RecordTable<IRecord> schema={fixture.schema} data={fixture.records} />
  );
}

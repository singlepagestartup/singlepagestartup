import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordList } from "./RecordProjection";
const schema = {
  module: "social",
  entity: "profile",
  entityType: "model",
  fields: [
    { key: "id", label: "ID", kind: "string", nullable: false },
    { key: "title", label: "Title", kind: "string", nullable: false },
  ],
};
const records = [{ id: "sample", title: "Example profile" }];
test("list count repeats a local model example without changing the fixture", () => {
  const html = renderToStaticMarkup(
    <RecordList schema={schema} records={records} count={20} />,
  );
  expect(html.match(/<article/g)).toHaveLength(20);
  expect(html.match(/Example profile/g)).toHaveLength(20);
  expect(records).toHaveLength(1);
});
test("empty, zero count and missing data render the empty state", () => {
  for (const props of [
    { empty: true },
    { count: 0 },
    { records: [] },
    { count: Number.NaN },
  ]) {
    const html = renderToStaticMarkup(
      <RecordList schema={schema} records={records} {...props} />,
    );
    expect(html).toContain("No records to display.");
    expect(html).not.toContain("<article");
  }
});

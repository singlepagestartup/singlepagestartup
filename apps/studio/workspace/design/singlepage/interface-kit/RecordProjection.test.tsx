import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RecordFind } from "./RecordProjection";

const schema = {
  module: "social",
  entity: "profiles-to-chats",
  entityType: "relation",
  fields: [],
};
const records = [
  { id: "one", profileId: "owner-a", chatId: "chat-1" },
  { id: "two", profileId: "owner-b", chatId: "chat-2" },
  { id: "three", profileId: "owner-a", chatId: "chat-3" },
];

test("relation find intersects owner and target filters and leaves input unchanged", () => {
  const html = renderToStaticMarkup(
    <RecordFind
      schema={schema}
      records={records}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "profileId", method: "eq", value: "owner-a" },
              { column: "chatId", method: "in", value: ["chat-3"] },
            ],
          },
        },
      }}
    >
      {({ data }) => (
        <output>{data.map((record) => record.id).join(",")}</output>
      )}
    </RecordFind>,
  );
  expect(html).toBe("<output>three</output>");
  expect(records.map((record) => record.id)).toEqual(["one", "two", "three"]);
});

test("relation find returns no records for an unrelated owner", () => {
  const html = renderToStaticMarkup(
    <RecordFind
      schema={schema}
      records={records}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: "missing" }],
          },
        },
      }}
    >
      {({ data }) => <output>{data.length}</output>}
    </RecordFind>,
  );
  expect(html).toBe("<output>0</output>");
});

test("like filters escape regex characters in user text", () => {
  const data = [
    { id: "one", text: "a+b.c" },
    { id: "two", text: "abxc" },
  ];
  const html = renderToStaticMarkup(
    <RecordFind
      schema={schema}
      records={data}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "text", method: "ilike", value: "%A+B.C%" }],
          },
        },
      }}
    >
      {({ data }) => (
        <output>{data.map((record) => record.id).join(",")}</output>
      )}
    </RecordFind>,
  );
  expect(html).toBe("<output>one</output>");
});

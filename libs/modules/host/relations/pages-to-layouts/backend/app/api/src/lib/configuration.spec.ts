import type { ISeedResult } from "@sps/shared-backend-api";
import { Configuration } from "./configuration";

const filter = new Configuration().repository.seed.filters![0];
const snapshot = {
  id: "snapshot-link",
  pageId: "snapshot-page",
  layoutId: "snapshot-target",
  createdAt: "2026-01-01T12:00:00.000Z",
  variant: "default",
  orderIndex: 0,
};
const seeds: ISeedResult[] = [
  {
    module: "host",
    type: "model",
    name: "page",
    seeds: [{ dump: { id: snapshot.pageId }, new: { id: "page" } }],
  },
  {
    module: "host",
    type: "model",
    name: "layout",
    seeds: [{ dump: { id: snapshot.layoutId }, new: { id: "target" } }],
  },
];
const previous = {
  id: "restored-link",
  pageId: "page",
  layoutId: "previous",
  createdAt: new Date(snapshot.createdAt),
  variant: "default",
  orderIndex: 0,
};
const additional = {
  ...previous,
  id: "other-link",
  layoutId: "other",
  createdAt: new Date("2026-01-02T12:00:00.000Z"),
};

function match(db: (typeof previous)[]) {
  return filter.value({ seeds, entity: { dump: snapshot, db } });
}

it("keeps the same relation ID when the snapshot's layout changes", () => {
  const original = { ...previous, id: snapshot.id, orderIndex: 2 };
  expect(match([original, additional])).toEqual([snapshot.id]);
});

it("updates a uniquely identified restored relation and reuses the target pair on repeat", () => {
  expect(match([previous, additional])).toEqual([previous.id]);
  expect(match([{ ...previous, layoutId: "target" }, additional])).toEqual([
    previous.id,
  ]);
});

it("leaves independent and ambiguous prior layouts untouched when adding a layout", () => {
  expect(match([additional])).toEqual([snapshot.id]);
  const ambiguous = { ...additional, createdAt: previous.createdAt };
  expect(match([previous, ambiguous])).toEqual([snapshot.id]);
});

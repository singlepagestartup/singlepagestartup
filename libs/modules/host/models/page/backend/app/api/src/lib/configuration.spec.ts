/**
 * BDD Suite: Page seed identity.
 * Given: one Page shared by all locales.
 * When: a Page snapshot is seeded, including a legacy snapshot without language.
 * Then: its URL is reconciled without creating a language-specific copy.
 */
import fs from "node:fs/promises";
import { Configuration } from "./configuration";
import { Repository } from "./repository";

afterEach(() => jest.restoreAllMocks());

it.each(["en", "ru", undefined])(
  "reconciles the same Page URL when a legacy snapshot has language %s",
  async (language) => {
    const rows = [
      { id: "page", url: "/about", language: "en", title: "About" },
      { id: "other", url: "/contacts", language: "en", title: "Contacts" },
    ];
    const originalOther = { ...rows[1] };
    const snapshot = {
      id: "snapshot-page",
      url: "/about",
      ...(language ? { language } : {}),
      title: "Updated snapshot",
    };
    jest.spyOn(fs, "readdir").mockResolvedValue(["page.json"] as any);
    jest.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(snapshot));
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    const repository = Object.assign(Object.create(Repository.prototype), {
      configuration: new Configuration().getConfiguration(),
      find: jest.fn(async (props) =>
        rows.filter((row) =>
          (props?.params?.filters?.and ?? []).every(
            (filter: { column: keyof (typeof rows)[0]; value: unknown }) =>
              row[filter.column] === filter.value,
          ),
        ),
      ),
      updateFirstByField: jest.fn(async (_field, id, data) => {
        const row = rows.find((r) => r.id === id)!;
        Object.assign(row, data);
        return row;
      }),
      insert: jest.fn(),
    }) as Repository;

    const result = await repository.seed();

    expect(repository.insert).not.toHaveBeenCalled();
    expect(repository.updateFirstByField).toHaveBeenCalledTimes(1);
    expect(result.seeds.map((seed) => seed.new.id)).toEqual(["page"]);
    expect(rows.find((r) => r.id === "page")?.title).toBe(snapshot.title);
    expect(rows.find((r) => r.id === originalOther.id)).toEqual(originalOther);
  },
);

describe("the Studio sign-in snapshot", () => {
  const canonicalUrl = "/rbac/subject/authentication/email-and-password";
  const studio = {
    id: "studio",
    url: "/ai-chat/sign-in",
    adminTitle: "Studio login",
  };
  const owned = { id: "owned", url: canonicalUrl };
  const input = {
    snapshot: studio,
    seeds: [],
    existing: [],
    snapshots: [studio],
  };

  it("uses the canonical URL on a new installation and on a repeat seed", () => {
    const prepare = new Configuration().repository.seed.prepareSnapshot!;
    const expected = { ...studio, url: canonicalUrl };
    expect(prepare(input)).toEqual(expected);
    expect(
      prepare({ ...input, existing: [{ ...expected, id: "local" }] }),
    ).toEqual(expected);
  });

  it("respects a project's existing page and a canonical page in its own seed", () => {
    const prepare = new Configuration().repository.seed.prepareSnapshot!;
    expect(prepare({ ...input, existing: [owned] })).toEqual(studio);
    expect(prepare({ ...input, snapshots: [studio, owned] })).toEqual(studio);
  });
});

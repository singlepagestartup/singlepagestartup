/**
 * BDD Suite: localized Page seed identity.
 * Given: two locales with the same saved URL.
 * When: a Page snapshot is seeded, including a legacy snapshot without language.
 * Then: only its locale is reconciled and the other Page and its ID survive.
 */
import fs from "node:fs/promises";
import { Configuration } from "./configuration";
import { Repository } from "./repository";

afterEach(() => jest.restoreAllMocks());

it.each(["en", "ru", undefined])(
  "preserves the other locale when seeding language %s",
  async (language) => {
    const rows = [
      { id: "en-page", url: "/about", language: "en", title: "English" },
      { id: "ru-page", url: "/about", language: "ru", title: "Русский" },
    ];
    const expectedLanguage = language ?? "en";
    const originalOther = {
      ...rows.find((r) => r.language !== expectedLanguage)!,
    };
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
    expect(result.seeds.map((seed) => seed.new.id)).toEqual([
      `${expectedLanguage}-page`,
    ]);
    expect(rows.find((r) => r.language === expectedLanguage)?.title).toBe(
      snapshot.title,
    );
    expect(rows.find((r) => r.id === originalOther.id)).toEqual(originalOther);
  },
);

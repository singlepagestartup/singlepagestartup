/**
 * BDD Suite: Page seed identity.
 * Given: one Page shared by all locales.
 * When: a snapshot changes its URL or an older dump omits its slug.
 * Then: the seed updates the existing page and keeps its local ID.
 */
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { Configuration } from "./configuration";
import { Repository } from "./repository";

afterEach(() => jest.restoreAllMocks());

it.each([
  { slug: "about", url: "/company", language: undefined },
  { slug: undefined, url: "/about", language: "en" },
  { slug: undefined, url: "/about", language: "ru" },
  { slug: undefined, url: "/about", language: undefined },
])(
  "reuses the Page when seeding slug $slug, URL $url and language $language",
  async ({ slug, url, language }) => {
    const rows = [
      {
        id: "page",
        url: "/about",
        slug: "about",
        language: "en",
        title: "About",
      },
      {
        id: "other",
        url: "/contacts",
        slug: "contacts",
        language: "en",
        title: "Contacts",
      },
    ];
    const originalOther = { ...rows[1] };
    const snapshot = {
      id: "snapshot-page",
      url,
      ...(slug ? { slug } : {}),
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
    expect(rows[0]).toMatchObject({
      id: "page",
      url,
      slug: "about",
      title: snapshot.title,
    });
    expect(rows.find((r) => r.id === originalOther.id)).toEqual(originalOther);
  },
);

it("adopts the dump slug only while the existing URL has its backfilled slug", () => {
  const filter = new Configuration().repository.seed.filters![0];
  const url = "/company";
  const initial = `page-${createHash("sha256").update(url).digest("hex")}`;
  const dump = { url, slug: "company" };
  const page = { url, slug: initial };
  const match = (db: (typeof page)[]) =>
    filter.value({ seeds: [], entity: { dump, db } });

  expect(match([page])).toBe(initial);
  expect(match([{ url, slug: "edited-by-owner" }])).toBe(dump.slug);
  expect(match([page, { url: "/previous", slug: dump.slug }])).toBe(dump.slug);
});

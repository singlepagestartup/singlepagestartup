import { describe, expect, it } from "bun:test";
import {
  preparePageLanguages,
  applyPageLanguages,
  type IPageLanguageSnapshot,
  type IPageLanguageApi,
} from "./page-languages";
function fixture(): IPageLanguageSnapshot {
  return {
    pages: [
      {
        id: "old",
        url: "/about",
        language: "en",
        title: "About",
        variant: "default",
        createdAt: "2025",
        metadata: { custom: { keep: true } },
      },
      {
        id: "copy",
        url: "/about",
        language: "ru",
        title: "О нас",
        variant: "default",
        createdAt: "2026",
        metadata: {},
      },
    ],
    metadata: [
      {
        id: "en",
        title: "About the framework",
        description: "Web development",
        opengraphTitle: "About",
        variant: "default",
      },
      {
        id: "ru",
        title: "О фреймворке",
        description: "Веб-разработка",
        opengraphTitle: "О нас",
        variant: "default",
      },
    ],
    links: [
      { id: "en-link", pageId: "old", metadataId: "en" },
      { id: "ru-link", pageId: "copy", metadataId: "ru" },
    ],
    widgets: [
      { id: "w1", pageId: "old", widgetId: "shared" },
      { id: "w2", pageId: "copy", widgetId: "shared" },
    ],
    layouts: [],
  };
}
describe("Page language consolidation", () => {
  it("keeps the original Page and both translations as explicit JSON mask inputs", () => {
    const plan = preparePageLanguages(fixture());
    const operation = plan.operations[0];
    expect(operation.pageId).toBe("old");
    expect(operation.duplicateIds).toEqual(["copy"]);
    expect(operation.pageMetadata.seo.title).toEqual({
      en: "About the framework",
      ru: "О фреймворке",
    });
    expect(operation.pageMetadata.custom).toEqual({ keep: true });
    expect(operation.metadataFields.title).toBe(
      "[host.pages.metadata.seo.title]",
    );
    expect(operation.pageMetadata.seoDisplay.opengraphTitle.ru).toBe("О нас");
  });
  it("refuses different page compositions before preparing any writes", () => {
    const rows = fixture();
    rows.widgets[1].widgetId = "another";
    expect(() => preparePageLanguages(rows)).toThrow(
      "Conflicting Page composition",
    );
  });
  it("preserves dynamic localized masks instead of copying values into Page", () => {
    const rows = fixture();
    rows.metadata.forEach((row) => {
      row.title = "[blog.articles.title]";
    });
    expect(
      preparePageLanguages(rows).operations[0].metadataFields.title,
    ).toBeUndefined();
  });
  it("refuses an edited Page and can resume a completed consolidation without writes", async () => {
    const rows = fixture();
    const plan = preparePageLanguages(structuredClone(rows));
    let writes = 0;
    const api = Object.fromEntries(
      Object.entries(rows).map(([key, records]) => [
        key,
        {
          find: async () => structuredClone(records),
          update: async ({ id, data }: any) => {
            writes++;
            Object.assign(records.find((r) => r.id === id)!, data);
          },
          delete: async ({ id }: any) => {
            writes++;
            records.splice(
              records.findIndex((r) => r.id === id),
              1,
            );
          },
        },
      ]),
    ) as IPageLanguageApi;
    rows.pages[1].title = "User edit";
    await expect(applyPageLanguages(plan, api, async () => {})).rejects.toThrow(
      "Page changed",
    );
    expect(writes).toBe(0);
    rows.pages[1].title = "О нас";
    await applyPageLanguages(plan, api, async () => {});
    expect(rows.pages).toHaveLength(1);
    expect(rows.metadata).toHaveLength(2);
    const prior = writes;
    await applyPageLanguages(plan, api, async () => {});
    expect(writes).toBe(prior);
  });
});

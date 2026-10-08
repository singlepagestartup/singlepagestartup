import { describe, expect, test } from "bun:test";
import {
  composeHostPage,
  createHostLink,
  createHostModel,
  createHostStudioState,
  removeHostModels,
  saveHostLink,
  saveHostModel,
  sortHostLinks,
  unlinkHostRecords,
  validateHostLink,
  validateHostModel,
} from "./index";
import { HOST_STUDIO_SAMPLE_IDS } from "./constants";

describe("Host Studio graph", () => {
  test("unlink preserves models and leaves unrelated links intact", () => {
    const state = createHostStudioState();
    const next = unlinkHostRecords(state, "pages-to-layouts", [
      state.relations["pages-to-layouts"][0].id,
    ]);
    expect(next.models).toBe(state.models);
    expect(next.relations["pages-to-layouts"]).toHaveLength(0);
    expect(next.relations["layouts-to-widgets"]).toBe(
      state.relations["layouts-to-widgets"],
    );
    expect(state.relations["pages-to-layouts"]).toHaveLength(1);
  });
  test("model deletion cascades through its links without deleting other models", () => {
    const state = createHostStudioState();
    const next = removeHostModels(state, "widget", [
      HOST_STUDIO_SAMPLE_IDS.content,
    ]);
    expect(next.models.widget).toHaveLength(2);
    expect(next.relations["pages-to-widgets"]).toHaveLength(0);
    expect(next.relations["widgets-to-external-widgets"]).toHaveLength(0);
    expect(next.models.page).toBe(state.models.page);
    expect(next.relations["layouts-to-widgets"]).toHaveLength(2);
  });
  test("composition scopes links, separates layout slots, and sorts without mutating", () => {
    let state = createHostStudioState();
    const ids = HOST_STUDIO_SAMPLE_IDS;
    state = saveHostLink(state, "pages-to-widgets", {
      ...createHostLink("pages-to-widgets", ids.page, ids.footer, "new"),
      orderIndex: -4,
    });
    state = saveHostLink(
      state,
      "pages-to-widgets",
      createHostLink("pages-to-widgets", "other-page", ids.header, "unrelated"),
    );
    const composition = composeHostPage(state, ids.page)!;
    expect(composition.widgets.map((link) => link.widgetId)).toEqual([
      ids.footer,
      ids.content,
    ]);
    expect(composition.layouts[0].before.map((link) => link.widgetId)).toEqual([
      ids.header,
    ]);
    expect(composition.layouts[0].after.map((link) => link.widgetId)).toEqual([
      ids.footer,
    ]);
    expect(state.relations["pages-to-widgets"][0].widgetId).toBe(ids.content);
    expect(composeHostPage(state, "missing")).toBeNull();
    expect(
      sortHostLinks([
        { ...state.relations["pages-to-widgets"][0], id: "b" },
        { ...state.relations["pages-to-widgets"][0], id: "a" },
      ]).map((link) => link.id),
    ).toEqual(["a", "b"]);
  });
  test("new records can be linked; a reused URL or slug is rejected", () => {
    let state = createHostStudioState();
    const page = { ...createHostModel("page", "new-page"), url: "/another" };
    expect(validateHostModel(state, "page", page)).toBeNull();
    state = saveHostModel(state, "page", page);
    expect(validateHostModel(state, "page", { ...page, id: "duplicate" })).toBe(
      "url already exists.",
    );
    expect(
      validateHostModel(state, "layout", {
        ...state.models.layout[0],
        id: "duplicate",
      }),
    ).toBe("slug already exists.");
    const link = createHostLink(
      "pages-to-layouts",
      page.id,
      state.models.layout[0].id,
      "new-link",
    );
    expect(validateHostLink(state, "pages-to-layouts", link)).toBeNull();
    state = saveHostLink(state, "pages-to-layouts", link);
    expect(composeHostPage(state, page.id)?.layouts).toHaveLength(1);
    expect(
      validateHostLink(state, "pages-to-layouts", {
        ...link,
        layoutId: "missing",
      }),
    ).toBe("Select an existing target.");
    expect(
      validateHostLink(state, "pages-to-layouts", { ...link, orderIndex: 1.5 }),
    ).toBe("Order must be a 32-bit integer.");
  });
  test("editing a shared record changes all compositions that use it", () => {
    const state = createHostStudioState();
    const layout = { ...state.models.layout[0], title: "Updated layout" };
    const next = saveHostModel(state, "layout", layout);
    expect(
      composeHostPage(next, state.models.page[0].id)?.layouts[0].layout.title,
    ).toBe("Updated layout");
    expect(state.models.layout[0].title).toBe("Journal layout");
  });
});

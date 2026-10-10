import { expect, test } from "bun:test";
import {
  createHostModel,
  createHostStudioState,
  removeHostModels,
  saveHostModel,
  validateHostModel,
} from "./index";

test("editing or removing a model sample leaves the original state and other models intact", () => {
  const state = createHostStudioState();
  const changed = saveHostModel(state, "layout", {
    ...state.models.layout[0],
    title: "Updated layout",
  });
  expect(changed.models.layout[0].title).toBe("Updated layout");
  expect(state.models.layout[0].title).toBe("Journal layout");
  const removed = removeHostModels(changed, "widget", [
    state.models.widget[0].id,
  ]);
  expect(removed.models.widget).toHaveLength(2);
  expect(state.models.widget).toHaveLength(3);
  expect(removed.models.page).toBe(state.models.page);
  expect(removed).not.toHaveProperty("relations");
});
test("form preview rejects a duplicate URL without mutating existing examples", () => {
  const state = createHostStudioState();
  const record = {
    ...createHostModel("page", "new-page"),
    url: state.models.page[0].url,
  };
  expect(validateHostModel(state, "page", record)).toBe("url already exists.");
  expect(state.models.page).toHaveLength(1);
});

/**
 * BDD Suite: MCP content-management localized field helper
 * Given SPS content records store localized copy as locale-keyed JSON objects
 * When Codex updates one locale through MCP
 * Then sibling locales are preserved and invalid field shapes are rejected
 */

import { z } from "zod";
import {
  buildLocalizedFieldPatch,
  mergeLocalizedField,
} from "./localized-field";
import { IContentEntityDescriptor } from "./types";

const descriptor: IContentEntityDescriptor = {
  key: "blog.widget",
  kind: "model",
  module: "blog",
  name: "widget",
  route: "/api/blog/widgets",
  title: "Blog Widget",
  description: "Blog widget",
  variants: ["default"],
  fields: [{ name: "title", type: "json", localized: true }],
  localizedFields: ["title"],
  relationFields: [],
  operations: ["find", "count", "get-by-id", "create", "update", "delete"],
  insertSchema: z.object({ title: z.record(z.any()).optional() }),
  selectSchema: z.object({ id: z.string(), title: z.record(z.any()) }),
  api: {
    find: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("MCP content-management localized field helper", () => {
  /**
   * BDD Scenario: Locale merge preserves sibling keys
   * Given a blog widget title already has multiple locales
   * When only title.en is changed
   * Then the returned patch keeps every other locale key
   */
  it("merges one locale without dropping siblings", () => {
    const patch = buildLocalizedFieldPatch({
      descriptor,
      current: {
        title: {
          en: "Articles",
          ru: "Статьи",
        },
      },
      field: "title",
      locale: "en",
      value: "Fresh articles",
    });

    expect(patch).toEqual({
      title: {
        en: "Fresh articles",
        ru: "Статьи",
      },
    });
  });

  /**
   * BDD Scenario: Non-localized field is rejected
   * Given a field is absent from the entity localized field list
   * When Codex attempts a locale-specific update
   * Then the helper raises a validation error
   */
  it("rejects fields that are not declared as localized", () => {
    expect(() =>
      mergeLocalizedField({
        descriptor,
        current: { adminTitle: "Articles" },
        field: "adminTitle",
        locale: "en",
        value: "Fresh articles",
      }),
    ).toThrow(
      "Validation error. blog.widget.adminTitle is not a localized field",
    );
  });

  /**
   * BDD Scenario: Non-object localized data is rejected
   * Given an existing localized field value is not a locale-keyed object
   * When a locale merge is requested
   * Then the helper refuses to build a destructive replacement patch
   */
  it("rejects localized fields whose current value is not an object", () => {
    expect(() =>
      mergeLocalizedField({
        descriptor,
        current: { title: ["Articles"] },
        field: "title",
        locale: "en",
        value: "Fresh articles",
      }),
    ).toThrow(
      "Validation error. blog.widget.title must be a locale-keyed object",
    );
  });
});

/**
 * BDD Suite: localized backend field utilities.
 *
 * Given: backend handlers accept localized fields from form payloads.
 * When: shared utilities normalize string and object localized values.
 * Then: handlers receive consistent locale records and validation errors.
 */

import { localizedFieldHasValue, normalizeLocalizedField } from "./index";

describe("localized backend field utilities", () => {
  /**
   * BDD Scenario
   * Given: a handler receives a plain string for a localized field.
   * When: the field is normalized.
   * Then: the value is assigned to the default language.
   */
  it("normalizes a plain string to the default language", () => {
    expect(
      normalizeLocalizedField("Telegram admin chat", "title", {
        entityName: "Chat",
      }),
    ).toMatchObject({
      en: "Telegram admin chat",
    });
  });

  /**
   * BDD Scenario
   * Given: a handler receives a locale-keyed object.
   * When: the field is normalized.
   * Then: all configured locale keys are present in the result.
   */
  it("normalizes a locale object to configured languages", () => {
    expect(
      normalizeLocalizedField(
        {
          en: "English title",
          ru: "Russian title",
        },
        "title",
        {
          entityName: "Chat",
        },
      ),
    ).toEqual({
      en: "English title",
      ru: "Russian title",
    });
  });

  /**
   * BDD Scenario
   * Given: a handler receives an invalid localized payload.
   * When: the field is normalized.
   * Then: the utility throws the same validation-style error handlers expect.
   */
  it("rejects invalid localized field payloads", () => {
    expect(() => {
      normalizeLocalizedField(["invalid"], "title", {
        entityName: "Chat",
      });
    }).toThrow("Validation error. Chat title must be localized");
  });

  /**
   * BDD Scenario
   * Given: a normalized localized field has at least one non-empty value.
   * When: the value helper checks it.
   * Then: it reports whether user-facing text exists.
   */
  it("detects whether a localized field has any non-empty value", () => {
    expect(localizedFieldHasValue({ en: "", ru: "  " })).toBe(false);
    expect(localizedFieldHasValue({ en: "Title", ru: "" })).toBe(true);
  });
});

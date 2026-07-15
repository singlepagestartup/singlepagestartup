/**
 * BDD Suite: social profile plain-text normalization.
 *
 * Given: social.profile text can be plain, localized, or stored as TipTap JSON.
 * When: shared model utilities normalize it for a backend or frontend consumer.
 * Then: consumers receive stable plain text without depending on a controller.
 */

import {
  getLocalizedProfilePlainText,
  profileTextToPlainText,
} from "./plain-text";

describe("Given: social profile text in supported persisted formats", () => {
  /**
   * BDD Scenario: a TipTap document is stored as JSON.
   *
   * Given: profile text contains block nodes and a hard break.
   * When: the shared model utility converts it.
   * Then: structural nodes become readable lines.
   */
  test("When: TipTap JSON is normalized Then: readable plain text is returned", () => {
    expect(
      profileTextToPlainText({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Первая строка" },
              { type: "hardBreak" },
              { type: "text", text: "продолжение" },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Вторая строка" }],
          },
        ],
      }),
    ).toBe("Первая строка\nпродолжение\nВторая строка");
  });

  /**
   * BDD Scenario: localized content has no requested language.
   *
   * Given: a profile contains English and another localized value.
   * When: Russian text is requested.
   * Then: the documented English fallback is returned.
   */
  test("When: requested localization is absent Then: a stable fallback is returned", () => {
    expect(
      getLocalizedProfilePlainText(
        {
          en: " English profile ",
          de: "Deutsches Profil",
        },
        "ru",
      ),
    ).toBe("English profile");
  });
});

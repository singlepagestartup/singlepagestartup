/**
 * BDD Suite: Plain receipt descriptions from editor content.
 * Given: stored rich text, legacy plain text or an absent description.
 * When: a server-rendered message reads the description.
 * Then: it receives readable text without editor JSON.
 */
import { richTextToPlainText } from "./index";
/**
 * BDD Scenario: rich text includes multiple paragraphs.
 * Given: an editor document with material and dimensions.
 * When: plain text is extracted.
 * Then: all paragraphs survive in order.
 */
it("retains every paragraph and inline text segment", () => {
  const value = JSON.stringify({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ text: "2020. " }, { text: "Бумага" }] },
      { type: "paragraph", content: [{ text: "22×22 см" }] },
    ],
  });
  expect(richTextToPlainText(value)).toBe("2020. Бумага\n22×22 см");
});
/**
 * BDD Scenario: older data has no rich text envelope.
 * Given: legacy plain text or no description.
 * When: plain text is requested.
 * Then: legacy text remains readable and missing data is empty.
 */
it("accepts legacy and missing descriptions", () => {
  expect(richTextToPlainText("Фарфор")).toBe("Фарфор");
  expect(richTextToPlainText(null)).toBe("");
});

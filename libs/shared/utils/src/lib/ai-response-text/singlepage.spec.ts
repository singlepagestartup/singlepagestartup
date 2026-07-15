/**
 * BDD Suite: portable AI response text.
 *
 * Given: a model returns LaTeX display math.
 * When: SPS prepares the canonical chat message.
 * Then: the formula remains readable in both the web chat and Telegram.
 */

import { normalizeAiResponseText } from "./singlepage";

describe("GIVEN: model-generated math", () => {
  /**
   * BDD Scenario: a fraction formula uses common LaTeX commands.
   *
   * Given: an OpenRouter response contains a display fraction and text labels.
   * When: the response is normalized for portable Markdown.
   * Then: delimiters and commands become readable plain-text math.
   */
  it("When: LaTeX display math is normalized Then: the formula is portable", () => {
    const result = normalizeAiResponseText(String.raw`Посчитайте доходность:

\[
\text{Чистая доходность} =
\frac{(\text{аренда в месяц} \times 12) - \text{расходы}}
{\text{цена покупки + ремонт}}
\times 100\%
\]`);

    expect(result).toBe(
      "Посчитайте доходность:\n\nЧистая доходность = ((аренда в месяц × 12) - расходы) / (цена покупки + ремонт) × 100%",
    );
    expect(result).not.toMatch(/\\(?:text|frac|times)|\\\[|\\\]/);
  });

  /**
   * BDD Scenario: ordinary Markdown does not contain math controls.
   *
   * Given: an AI response already uses portable Markdown.
   * When: the response is normalized.
   * Then: its content remains unchanged.
   */
  it("When: portable Markdown is normalized Then: it is preserved", () => {
    expect(
      normalizeAiResponseText("**Доходность:** 12%\n\n- Простой: 5%"),
    ).toBe("**Доходность:** 12%\n\n- Простой: 5%");
  });
});

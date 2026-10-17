import { getEncoding } from "js-tiktoken";
import { estimateAiContextTokens } from "./index";
it("estimates multilingual text with o200k_base and the configured margin", () => {
  const text = "Цена 250 000 ₽. The duration remains unknown. <|endoftext|>";
  expect(estimateAiContextTokens(text)).toBe(
    Math.ceil(getEncoding("o200k_base").encode(text, [], []).length * 1.2),
  );
  expect(estimateAiContextTokens("")).toBe(0);
});

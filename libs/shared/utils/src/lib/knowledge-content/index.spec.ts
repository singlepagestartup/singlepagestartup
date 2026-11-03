import { sliceKnowledgeToolText } from "./index";

describe("Knowledge tool text byte limits", () => {
  it("counts UTF-8 and JSON escapes without splitting Unicode characters", () => {
    const text = 'Я😀\n"\\\t'.repeat(100);
    const page = sliceKnowledgeToolText(text, 64);
    expect(Buffer.byteLength(JSON.stringify(page), "utf8")).toBeLessThanOrEqual(
      64,
    );
    expect(text.startsWith(page)).toBe(true);
    expect(page).toBe(
      Array.from(text).slice(0, Array.from(page).length).join(""),
    );
    expect(page.length).toBeLessThan(text.length);
  });

  it("returns a complete character when the requested limit is one", () => {
    expect(sliceKnowledgeToolText("😀 next", 64, 1)).toBe("😀");
  });
});

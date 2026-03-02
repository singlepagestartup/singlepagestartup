/**
 * BDD Suite: get-model-name-variants.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util } from ".";

describe("get-model-name-variants", () => {
  it("should create wide slide from wide-slide in .base", () => {
    const name = "wide-slide";

    const result = util({ name });
    expect(result.base).toBe("wide slide");
  });

  describe("snakeCased", () => {
    it("should create wide_slide from wide-slide in .snakeCased.base", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.snakeCased.base).toBe("wide_slide");
    });

    it("should create wese from wide-slide in .snakeCased.baseCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.snakeCased.baseCutted).toBe("we_se");
    });

    it("should create wess from wide-slide in .snakeCased.pluralizedCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.snakeCased.pluralizedCutted).toBe("we_ss");
    });

    it("should create wide_slides from wide-slide in .snakeCased.pluralized", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.snakeCased.pluralized).toBe("wide_slides");
    });
  });

  describe("propertyCased", () => {
    it("should create wideSlide from wide-slide in .propertyCased.base", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.propertyCased.base).toBe("wideSlide");
    });

    it("should create weSe from wide-slide in .propertyCased.baseCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.propertyCased.baseCutted).toBe("weSe");
    });

    it("should create wideSlides from wide-slide in .propertyCased.pluralized", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.propertyCased.pluralized).toBe("wideSlides");
    });

    it("should create wideSlides from wide-slide in .propertyCased.pluralizedCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.propertyCased.pluralizedCutted).toBe("weSs");
    });
  });

  describe("pascalCased", () => {
    it("should create WideSlide from wide-slide in .pascalCased.base", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.pascalCased.base).toBe("WideSlide");
    });

    it("should create WideSlides from wide-slide in .pascalCased.pluralized", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.pascalCased.pluralized).toBe("WideSlides");
    });

    it("should create WeSe from wide-slide in .pascalCased.baseCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.pascalCased.baseCutted).toBe("WeSe");
    });

    it("should create WeSs from wide-slide in .pascalCased.pluralizedCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.pascalCased.pluralizedCutted).toBe("WeSs");
    });
  });

  describe("kebabCased", () => {
    it("should create wide-slide from wide-slide in .kebabCased.base", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.kebabCased.base).toBe("wide-slide");
    });

    it("should create we-se from wide-slide in .kebabCased.baseCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.kebabCased.baseCutted).toBe("we-se");
    });

    it("should create wide-slides from wide-slide in .kebabCased.pluralized", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.kebabCased.pluralized).toBe("wide-slides");
    });

    it("should create wide-slides from wide-slide in .kebabCased.pluralizedCutted", () => {
      const name = "wide-slide";

      const result = util({ name });
      expect(result.kebabCased.pluralizedCutted).toBe("we-ss");
    });
  });
});

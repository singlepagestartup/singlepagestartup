/**
 * BDD Suite: utils/formatters/replacer.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util as replacer } from ".";

describe("utils/formatters/replacer", () => {
  it("should replace characters in the string with the specified symbol", () => {
    const input = "example@example.com";
    const expectedOutput = "ex###############om";
    const actualOutput = replacer(input, [2, 2], "#");
    expect(actualOutput).toEqual(expectedOutput);
  });

  it("should replace characters in the string with the default symbol * if not specified", () => {
    const input = "example@example.com";
    const expectedOutput = "ex***************om";
    const actualOutput = replacer(input, [2, 2]);
    expect(actualOutput).toEqual(expectedOutput);
  });

  it("should replace characters in the string with the default symbol * and default symbols count [3, 3] if not specified", () => {
    const input = "example@example.com";
    const expectedOutput = "exa*************com";
    const actualOutput = replacer(input);
    expect(actualOutput).toEqual(expectedOutput);
  });
});

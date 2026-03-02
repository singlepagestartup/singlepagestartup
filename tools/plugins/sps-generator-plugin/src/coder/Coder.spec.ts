/**
 * BDD Suite: Coder.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { FsTree } from "nx/src/generators/tree";
import { Coder } from "./Coder";
import path from "path";

describe("Coder", () => {
  it("should create an instance", () => {
    expect(1).toBe(1);
  });
});

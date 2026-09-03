/**
 * BDD Suite: Artifact-derived project presentation
 * Given canonical SinglePageStartup business, strategy, evidence, brand, design, and asset sources
 * When Studio assembles the React presentation data
 * Then the deck contains the approved project decisions and preserves layer inheritance
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { IStudioArtifact, IStudioWorkspace } from "../types";
import {
  projectPresentationData,
  resolvedProjectPresentationData,
} from "./presentation-data";

const workspaceRoot = path.resolve(import.meta.dir, "..");
const kinds = [
  "brief",
  "business",
  "strategy",
  "brand",
  "design",
  "evidence",
  "asset-index",
  "product",
] as const;

function sourcePath(kind: (typeof kinds)[number], layer: string): string {
  if (kind === "asset-index") return `assets/${layer}.yaml`;
  if (kind === "product") {
    return layer === "singlepage"
      ? "products/singlepage/singlepagestartup/product.md"
      : "products/startup.yaml";
  }
  return `${kind}/${layer}.md`;
}

function artifact(
  kind: (typeof kinds)[number],
  content: string,
  layer: "singlepage" | "startup",
): IStudioArtifact {
  const relativePath = sourcePath(kind, layer);
  return {
    content,
    description: kind,
    id: `${layer}.${kind}`,
    inherited: false,
    kind,
    layer,
    resolution: "local",
    sourceIds: [`${layer}.${kind}`],
    sourcePath: relativePath,
    sourcePaths: [relativePath],
    usedBy: [],
    uses: [],
  };
}

function workspace(
  layer: "singlepage" | "startup",
  empty = false,
): IStudioWorkspace {
  return {
    activeLayer: layer,
    artifacts: kinds.map((kind) =>
      artifact(
        kind,
        empty
          ? ""
          : readFileSync(
              path.join(workspaceRoot, sourcePath(kind, layer)),
              "utf8",
            ),
        layer,
      ),
    ),
    exports: [],
    id: layer,
    imports: [],
    label: layer,
    workspaceRoot: "apps/studio/workspace",
  };
}

describe("project presentation data", () => {
  /**
   * BDD Scenario: Build the approved SinglePageStartup review deck
   * Given the populated singlepage source artifacts
   * When presentation data is derived
   * Then it contains the product, experiment, evidence, showcase, and identity decisions
   */
  test("derives the approved SinglePageStartup decisions", () => {
    const data = projectPresentationData(workspace("singlepage"), "singlepage");

    expect(data.name).toBe("SinglePageStartup");
    expect(data.promise).toStartWith(
      "Evaluate one pinned Code Framework release",
    );
    expect(data.modules).toHaveLength(16);
    expect(data.signals).toHaveLength(5);
    expect(data.signals.every((signal) => signal.detail.length > 0)).toBe(true);
    expect(data.experiment.facts).toEqual([
      "3 weeks",
      "6 h / week",
      "18 h total",
      "$0 paid media",
      "$200 token subsidy",
      "$1 / promo user / day",
    ]);
    expect(data.showcase.description).toContain(
      "AI-agent demonstration service",
    );
    expect(data.brand.primaryLogoUrl).toBe(
      "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg",
    );
    expect(data.risks).toHaveLength(5);
    expect(JSON.stringify(data)).not.toContain(
      "Design follows this source layer only",
    );
  });

  /**
   * BDD Scenario: Preserve exact presentation inheritance
   * Given startup has no presentation-relevant data
   * When default presentation data is resolved
   * Then it equals the singlepage presentation data without a third editable variant
   */
  test("inherits singlepage presentation data when startup is empty", () => {
    const singlepage = workspace("singlepage");
    const startup = workspace("startup", true);

    expect(
      resolvedProjectPresentationData({
        default: singlepage,
        singlepage,
        startup,
      }),
    ).toEqual(projectPresentationData(singlepage, "singlepage"));
  });

  /**
   * BDD Scenario: Render a project while upstream decisions are incomplete
   * Given startup contains living artifacts with partial tables during a blocked stage
   * When presentation data is derived for the Products review
   * Then missing optional cells become empty values instead of crashing Storybook
   */
  test("tolerates partial startup decision tables", () => {
    const data = projectPresentationData(workspace("startup"), "startup");

    expect(data.projection).toBe("startup");
    expect(
      data.risks.every((risk) => typeof risk.consequence === "string"),
    ).toBe(true);
  });
});

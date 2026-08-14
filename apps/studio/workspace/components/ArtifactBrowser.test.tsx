/**
 * BDD Suite: Human-readable Studio artifact titles
 * Given workspace artifacts retain technical IDs for resolution and dependency tracking
 * When an artifact is presented in Storybook Studio
 * Then its visible heading uses the human-readable artifact kind instead of the technical ID
 */

import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ArtifactDocument } from "./ArtifactBrowser";

import type { IStudioWorkspace } from "../types";

describe("ArtifactDocument", () => {
  /**
   * BDD Scenario: Present the resolved brief with a human title
   * Given the resolved brief retains the internal startup.brief ID
   * When the document header is rendered
   * Then the heading says Brief and does not expose startup.brief
   */
  test("shows Brief instead of the internal startup.brief ID", () => {
    const workspace: IStudioWorkspace = {
      activeLayer: "startup",
      artifacts: [
        {
          content: "# Brief",
          description: "Project brief",
          id: "startup.brief",
          inherited: true,
          kind: "brief",
          layer: "startup",
          resolution: "inherited",
          sourceIds: ["singlepage.brief", "startup.brief"],
          sourcePath: "apps/studio/workspace/brief/singlepage.md",
          sourcePaths: [
            "apps/studio/workspace/brief/singlepage.md",
            "apps/studio/workspace/brief/startup.md",
          ],
          usedBy: [],
          uses: [],
        },
      ],
      exports: [],
      id: "default",
      imports: [],
      label: "default (resolved)",
      workspaceRoot: "apps/studio/workspace",
    };

    const html = renderToStaticMarkup(
      <ArtifactDocument kind="brief" workspace={workspace} />,
    );

    expect(html).toContain(">Brief</h1>");
    expect(html).not.toContain(">startup.brief</h1>");
  });

  /**
   * BDD Scenario: Present the asset registry with the sidebar name
   * Given the registry keeps asset-index as its internal artifact kind
   * When any Assets projection is rendered
   * Then the visible badge and heading say Assets and hide the technical kind
   */
  test("shows Assets instead of the internal asset-index kind", () => {
    const workspace: IStudioWorkspace = {
      activeLayer: "singlepage",
      artifacts: [
        {
          content: "schema: singlepagestartup.asset-index.v1\nassets: []",
          description: "Asset registry",
          id: "singlepage.asset-index",
          inherited: false,
          kind: "asset-index",
          layer: "singlepage",
          resolution: "local",
          sourceIds: ["singlepage.asset-index"],
          sourcePath: "apps/studio/workspace/assets/singlepage.yaml",
          sourcePaths: ["apps/studio/workspace/assets/singlepage.yaml"],
          usedBy: [],
          uses: [],
        },
      ],
      exports: [],
      id: "singlepage",
      imports: [],
      label: "singlepage source",
      workspaceRoot: "apps/studio/workspace",
    };

    const html = renderToStaticMarkup(
      <ArtifactDocument kind="asset-index" workspace={workspace} />,
    );

    expect(html).toContain(">Assets</h1>");
    expect(html).toContain(">Assets</span>");
    expect(html).not.toContain(">Asset Index</h1>");
    expect(html).not.toContain(">asset-index</span>");
  });

  /**
   * BDD Scenario: Name the empty startup asset override consistently
   * Given the startup asset source is empty
   * When its inspection story is rendered
   * Then the empty-state heading uses Assets instead of asset-index
   */
  test("shows No Assets override for an empty startup source", () => {
    const workspace: IStudioWorkspace = {
      activeLayer: "startup",
      artifacts: [
        {
          content: "",
          description: "Asset registry",
          id: "startup.asset-index",
          inherited: false,
          kind: "asset-index",
          layer: "startup",
          resolution: "local",
          sourceIds: ["startup.asset-index"],
          sourcePath: "apps/studio/workspace/assets/startup.yaml",
          sourcePaths: ["apps/studio/workspace/assets/startup.yaml"],
          usedBy: [],
          uses: [],
        },
      ],
      exports: [],
      id: "startup",
      imports: [],
      label: "startup overrides",
      workspaceRoot: "apps/studio/workspace",
    };

    const html = renderToStaticMarkup(
      <ArtifactDocument kind="asset-index" workspace={workspace} />,
    );

    expect(html).toContain(">No Assets override</h1>");
    expect(html).not.toContain("No asset-index override");
  });
});

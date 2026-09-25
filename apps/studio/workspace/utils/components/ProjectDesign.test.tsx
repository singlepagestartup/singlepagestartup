/**
 * BDD Suite: Focused Design review surface
 * Given the Design source contains internal analysis and registered identity assets
 * When Studio renders the reusable Design system
 * Then it hides process-only analysis and presents each logo on an appropriate review surface
 */

import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import ProjectDesign from "./ProjectDesign";

import type { IProjectDesignData } from "./ProjectDesign";

const data: IProjectDesignData = {
  assets: [
    {
      designKey: "primary-horizontal-dark-full",
      designRole: "logo",
      id: "dark-horizontal-logo",
      lifecycle: "proposed",
      path: "assets/startup/generated/identity/dark.svg",
      previewUrl: "/workspace-assets/startup/generated/identity/dark.svg",
      purpose: "Horizontal logo for a dark surface.",
      sourceType: "generated",
    },
  ],
  bodyType: "Manrope",
  bodyTypeLabel: "Manrope",
  colorRoles: [],
  conceptName: "Editorial system",
  conceptSummary: "A reusable visual system.",
  displayType: "Unbounded",
  displayTypeLabel: "Unbounded",
  doDont: [],
  graphicRules: [],
  illustration: {
    examples: [],
    intro: "Illustration rules.",
    masterPrompt: "Illustration prompt.",
    productionRules: [],
  },
  interface: {
    intro: "A reference proves a liked appearance, never a shipped screen.",
    patterns: [
      {
        avoid: "colour as the only selection signal",
        decision: "One inset surface holds grouped options.",
        references: ["interface-reference-license-card"],
        title: "Choice group",
      },
    ],
    shapeRules: ["Build every surface from the Canvas field."],
    stateRules: ["Allow one dominant action per view."],
  },
  logoRules: ["Keep source artwork unchanged."],
  palette: {
    accent: "#3275E7",
    background: "#DEE2E5",
    foreground: "#0C2234",
    line: "#A6B7C4",
    muted: "#7E8F9C",
    primary: "#0C2234",
    surface: "#FFFFFF",
  },
  photography: {
    examples: [],
    intro: "Photography rules.",
    masterPrompt: "Photography prompt.",
    productionRules: [],
  },
  preferenceProfile: "Internal reference analysis only.",
  projection: "startup",
  typographyRoles: [],
  typographyRules: [],
};

describe("ProjectDesign", () => {
  /**
   * BDD Scenario: Keep preference analysis out of the final review surface
   * Given the canonical Design document retains its internal visual preference profile
   * When the resolved Design system is rendered
   * Then the process-only profile is not presented as a public Design section
   */
  test("hides the internal visual preference profile", () => {
    const html = renderToStaticMarkup(<ProjectDesign data={data} />);

    expect(html).not.toContain("preference-profile");
    expect(html).not.toContain("Internal reference analysis only.");
  });

  /**
   * BDD Scenario: Present transparent logo artwork on the card surface
   * Given a wide logo is designated for a dark background
   * When Studio renders the identity card
   * Then the card supplies the dark surface and the artwork receives a wide preview box
   */
  test("uses the card surface and a wide preview box for logos", () => {
    const html = renderToStaticMarkup(<ProjectDesign data={data} />);

    expect(html).toContain("max-w-lg");
    expect(html).toContain(
      "background-color:var(--workspace-brand-primary, #0C2234)",
    );
  });

  /**
   * BDD Scenario: Cite interface references without reproducing them
   * Given operator-supplied interface references prohibit reproducing their layout
   * When Studio renders the interface block
   * Then it presents the project's own rules and patterns and cites each asset ID as text only
   */
  test("cites interface references as provenance text rather than artwork", () => {
    const html = renderToStaticMarkup(<ProjectDesign data={data} />);

    const start = html.indexOf('id="interface"');
    const block = html.slice(start, html.indexOf("<section", start + 1));

    expect(start).toBeGreaterThan(-1);
    expect(block).toContain("Surface, density, and shape");
    expect(block).toContain("Allow one dominant action per view.");
    expect(block).toContain("interface-reference-license-card");
    expect(block).not.toContain("<img");
  });
});

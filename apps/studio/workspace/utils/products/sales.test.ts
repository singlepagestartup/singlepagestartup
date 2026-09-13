/**
 * BDD Suite: Product-specific sales process
 * Given one active product has a machine-readable sales workflow
 * When Studio parses and renders that workflow
 * Then the product identity, completion rule, fallback, and metric remain explicit
 */

import { describe, expect, test } from "bun:test";

import {
  parseSalesProcess,
  salesProcessMarkdown,
  validateSalesSegments,
} from "./sales";
import { stringify } from "yaml";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { salesSegmentPages } from "../components/SalesSegment";

const source = `schema: singlepagestartup.sales-process.v1
product_id: framework-product
readiness: blocked
owner: Sales owner
seller: Seller of record
pricing: 100 RUB
capacity: One order per week
blockers:
  - Contract is not approved
stages:
  - id: qualify
    name: Qualify
    owner: Sales owner
    entry_conditions:
      - Contact exists
    required_fields:
      - Need
    action: Verify fit
    exit_condition: Fit is recorded
    failure: Close as not a fit
    metric: Qualified leads per week
`;

describe("sales process", () => {
  /**
   * BDD Scenario: Preserve an unknown process during initial intake.
   * Given: the client has not supplied the process and a blocker names the gap.
   * When: intake is parsed without stages.
   * Then: blocked intake is accepted, but it cannot be called ready or gap-free.
   */
  test("accepts explicit unknown intake without inventing stages", () => {
    const intake = source.split("stages:")[0] + "stages: []\n";
    expect(parseSalesProcess(intake).stages).toEqual([]);
    expect(() =>
      parseSalesProcess(
        intake.replace("readiness: blocked", "readiness: ready"),
      ),
    ).toThrow();
    expect(() =>
      parseSalesProcess(
        intake.replace(
          "blockers:\n  - Contract is not approved",
          "blockers: []",
        ),
      ),
    ).toThrow();
  });
  /**
   * BDD Scenario: Preserve process controls in the Studio document
   * Given a valid sales-process source for the expected product
   * When it is rendered as Markdown
   * Then the stage exit, fallback, and metric are visible
   */
  test("renders explicit stage controls", () => {
    const process = parseSalesProcess(source, "framework-product");
    const markdown = salesProcessMarkdown(process);

    expect(process.product_id).toBe("framework-product");
    expect(markdown).toContain("Fit is recorded");
    expect(markdown).toContain("Close as not a fit");
    expect(markdown).toContain("Qualified leads per week");
  });

  /**
   * BDD Scenario: Prevent cross-product sales documents
   * Given the active product requests its own sales process
   * When the document declares a different product id
   * Then parsing fails instead of mixing two offers
   */
  test("rejects a sales process from another product", () => {
    expect(() => parseSalesProcess(source, "another-product")).toThrow(
      "must match catalog product another-product",
    );
  });
});

// A downstream business with two different purchasing contexts.
const decisionProfile = (id: string, name: string) => ({
  id,
  name,
  audience: `${name} with a defined service need`,
  roles: "The customer chooses and pays for the service.",
  needs: ["Get a useful outcome"],
  motivations: ["Resolve the recurring task"],
  decision_criteria: ["Fits the task and spending limit"],
  purchase_trigger: "A new service need",
  value_proposition: `An offer for ${name}`,
  objections: [
    {
      concern: "Will it fit?",
      response: "Explain the scope",
      evidence: "A relevant example",
    },
  ],
  acquisition: [
    {
      id: "search",
      channel: "Search",
      context: "Looking for an answer",
      message: name,
      cta: "Explore the service",
      destination: "Service page",
    },
  ],
  journey: [
    {
      id: "choose",
      name: "Choose the service",
      owner: "Customer",
      entry_conditions: ["A relevant need"],
      required_fields: ["Desired outcome"],
      action: "Explain the scope",
      exit_condition: "Customer chooses",
      failure: "Select another offer",
      metric: "Customers choosing",
      customer_goal: `Resolve ${id} task`,
      customer_action: "Compare offers",
      customer_question: "Does this fit my need?",
      experience: "Clarity about the choice",
      touchpoint: "Service page",
    },
  ],
});
const segmented = () => ({
  schema: "singlepagestartup.sales-process.v2",
  product_id: "framework-product",
  readiness: "ready",
  owner: "Service owner",
  seller: "Service provider",
  pricing: "Published service price",
  capacity: "By appointment",
  blockers: [],
  segments: [
    decisionProfile("individuals", "Individuals"),
    decisionProfile("teams", "Teams"),
  ],
});

/** BDD Scenario: Each Product segment retains its own decision profile and customer perspective
 * Given a ready process serves two different customer segments
 * When Sales is rendered and checked against Product
 * Then both journeys and their distinct goals are retained without mixing profiles
 */
test("keeps segment decisions and CJMs distinct", () => {
  const process = parseSalesProcess(stringify(segmented()));
  validateSalesSegments(process, ["individuals", "teams"]);
  const markdown = salesProcessMarkdown(process);
  expect(markdown).toContain("Resolve individuals task");
  expect(markdown).toContain("Resolve teams task");
  expect(markdown).toContain("Customer Journey Map (CJM)");
  expect(markdown).toContain("Does this fit my need?");
  expect(markdown).not.toContain("## Stages");
});

/** BDD Scenario: A missing customer perspective cannot masquerade as a CJM
 * Given a populated segment journey has only operational fields
 * When Sales is parsed
 * Then the absent customer question is reported
 */
test("requires a customer perspective in each journey", () => {
  const input: any = segmented();
  delete input.segments[0].journey[0].customer_question;
  expect(() => parseSalesProcess(stringify(input))).toThrow(
    "customer_question",
  );
});

/** BDD Scenario: Segment coverage protects downstream communication
 * Given Product declares two segments
 * When a Sales profile is omitted or belongs to another Product
 * Then validation rejects missing and foreign segment IDs
 */
test("rejects missing or foreign Product segments", () => {
  const process = parseSalesProcess(stringify(segmented()));
  expect(() =>
    validateSalesSegments(process, ["individuals", "foreign"]),
  ).toThrow("absent from Product");
  expect(() =>
    validateSalesSegments(process, ["individuals", "teams", "partners"]),
  ).toThrow("missing customer segment partners");
  expect(() => validateSalesSegments(process, undefined)).toThrow(
    "customer_segments",
  );
});

/** BDD Scenario: Repeated identifiers cannot send a reader to the wrong segment
 * Given a source repeats a segment or a journey point within it
 * When the parser builds the navigation data
 * Then it reports the collision
 */
test("rejects duplicate segment, channel and journey identifiers", () => {
  const segmentInput = segmented();
  segmentInput.segments[1].id = "individuals";
  expect(() => parseSalesProcess(stringify(segmentInput))).toThrow(
    "repeats individuals",
  );
  const journeyInput = segmented();
  journeyInput.segments[0].journey.push(journeyInput.segments[0].journey[0]);
  expect(() => parseSalesProcess(stringify(journeyInput))).toThrow(
    "repeats choose",
  );
  const channelInput = segmented();
  channelInput.segments[0].acquisition.push(
    channelInput.segments[0].acquisition[0],
  );
  expect(() => parseSalesProcess(stringify(channelInput))).toThrow(
    "repeats search",
  );
});

/** BDD Scenario: Unknown intake remains writable before client decisions
 * Given no audience journey has been defined
 * When the intake is explicitly blocked
 * Then empty segments are accepted but cannot be called ready
 */
test("preserves unknown v2 intake without invented profiles", () => {
  const intake = {
    ...segmented(),
    readiness: "blocked",
    blockers: ["Customer intake required"],
    segments: [],
  };
  expect(parseSalesProcess(stringify(intake)).segments).toEqual([]);
  expect(() =>
    parseSalesProcess(stringify({ ...intake, readiness: "ready" })),
  ).toThrow();
});

/** BDD Scenario: Legacy migration never silently discards authored segments
 * Given v2 data is mistakenly saved under v1 or with a second global journey
 * When Sales loads
 * Then it rejects the ambiguous source
 */
test("rejects ambiguous mixed Sales schemas", () => {
  expect(() =>
    parseSalesProcess(
      stringify({
        ...segmented(),
        schema: "singlepagestartup.sales-process.v1",
        stages: [],
      }),
    ),
  ).toThrow("require sales-process.v2");
  expect(() =>
    parseSalesProcess(stringify({ ...segmented(), stages: [] })),
  ).toThrow("not a second stages list");
});

/** BDD Scenario: Downstream projects use shared navigation, review and export
 * Given a startup Sales source with two segments and whole-document confirmation
 * When the shared page builder renders an individual segment
 * Then it carries that source and status, exposes a CJM and exports only its own text
 */
test("generates independent segment views and Markdown for a startup", () => {
  const process = parseSalesProcess(stringify(segmented()));
  const status = {
    confirmed: false,
    state: "unconfirmed" as const,
    layer: "startup" as const,
  };
  const pages = salesSegmentPages(
    process,
    "startup",
    "apps/studio/workspace/products/startup/framework-product/sales.yaml",
    status,
  );
  expect(pages[0].children).toHaveLength(2);
  const page = pages[0].children[0];
  expect(page.confirmation).toBe(status);
  expect(page.downloadName).toBe("framework-product-individuals-sales.md");
  expect(page.markdown).toContain("Resolve individuals task");
  expect(page.markdown).not.toContain("Resolve teams task");
  expect(page.markdown).not.toContain("confirmed:");
  const html = renderToStaticMarkup(createElement(page.Component!));
  expect(html).toContain("Customer Journey Map (CJM)");
  expect(html).toContain('scope="row"');
  expect(html).toContain("Resolve individuals task");
  expect(html).not.toContain("Resolve teams task");
});

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
  expect(markdown).toContain("Карта пути клиента (CJM)");
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
  ).toThrow("unsupported schema");
  expect(() =>
    parseSalesProcess(stringify({ ...segmented(), stages: [] })),
  ).toThrow("not a second stages list");
});

test("rejects another product's sales process", () => {
  expect(() =>
    parseSalesProcess(stringify(segmented()), "another-product"),
  ).toThrow("must match catalog product");
});

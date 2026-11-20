import {
  funnelDefinitionSchema,
  stageWorkCapabilities,
} from "@sps/crm/models/funnel/sdk/model";
import { validatePublication } from "./utils";

it("rejects unknown targets and stage IDs that cannot identify a single stage", () => {
  const action = {
    id: "reply",
    name: "Reply",
    actors: ["manager"],
    evidence: ["manual"],
    nextStageId: "missing",
  };
  const stage = { id: "intake", name: "Intake", actions: [action] };
  const definition = funnelDefinitionSchema.parse({
    initialStageId: stage.id,
    stages: [stage],
  });
  expect(() => validatePublication(definition, "consultation")).toThrow(
    "unknown stage",
  );
  const duplicate = {
    ...definition,
    stages: [...definition.stages, ...definition.stages],
  };
  expect(() => validatePublication(duplicate, "consultation")).toThrow(
    "must be unique",
  );
});

it("rejects buyer confirmation or payment evidence for an action attributed only to the manager", () => {
  const definition = funnelDefinitionSchema.parse({
    initialStageId: "payment",
    stages: [
      {
        id: "payment",
        name: "Awaiting payment",
        actions: [
          {
            id: "pay",
            name: "Mark paid",
            actors: ["manager"],
            evidence: ["payment"],
            outcome: "completed",
          },
        ],
      },
    ],
  });
  expect(() => validatePublication(definition, "physical-order")).toThrow(
    "requires a system action",
  );
});

it("preserves old definitions and restricts file output to funded individual services", () => {
  const stage = { id: "make", name: "Production", actions: [] };
  const build = (output?: "pdf" | "image") =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...stage, output }],
    });

  expect(() => validatePublication(build(), "consultation")).not.toThrow();
  expect(() =>
    validatePublication(build("image"), "individual-service"),
  ).toThrow("funded individual-service");

  const funded = {
    ...build("pdf"),
    workFunding: {
      payer: "store-owner" as const,
      currencyId: "5bd2af60-e3f0-4494-a8b1-c645c2369129",
      maxTaskAmount: "10",
      maxRunAmount: "5",
    },
  };
  expect(() => validatePublication(funded, "physical-order")).toThrow(
    "individual-service",
  );
  expect(() => validatePublication(funded, "individual-service")).not.toThrow();
});

it("keeps the marketplace cover brief on image stages only", () => {
  const stage = {
    id: "cover",
    name: "Marketplace cover",
    actions: [],
    operations: ["vision"],
    imageBrief: "marketplace-cover",
  };
  const parse = (output?: string) =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...stage, output }],
    });

  const [image] = parse("image").stages;
  expect(image.imageBrief).toBe("marketplace-cover");
  expect(stageWorkCapabilities(image)).toEqual(["image"]);
  expect(stageWorkCapabilities({ ...image, imageBrief: undefined })).toEqual([
    "image",
    "vision",
  ]);
  expect(() => parse()).toThrow(
    "Marketplace cover brief requires image output",
  );
  expect(() => parse("pdf")).toThrow(
    "Marketplace cover brief requires image output",
  );
});

it("preserves explicit skill selections on the assigned stage", () => {
  const skillId = "5bd2af60-e3f0-4494-a8b1-c645c2369129";
  const assigneeId = "5bd2af60-e3f0-4494-a8b1-c645c2369130";
  const stage = {
    id: "cover",
    name: "Cover",
    actions: [],
    skillIds: [skillId],
  };
  expect(() =>
    funnelDefinitionSchema.parse({ initialStageId: stage.id, stages: [stage] }),
  ).toThrow("Stage skills require an assigned agent");
  const assigned = { ...stage, defaultAssigneeSubjectId: assigneeId };
  expect(
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [assigned],
    }).stages[0].skillIds,
  ).toEqual([skillId]);
  expect(() =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...assigned, skillIds: [skillId, skillId] }],
    }),
  ).toThrow();
});

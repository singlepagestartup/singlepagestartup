import { funnelDefinitionSchema } from "@sps/crm/models/funnel/sdk/model";
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
  expect(() => validatePublication(definition)).toThrow("unknown stage");
  const duplicate = {
    ...definition,
    stages: [...definition.stages, ...definition.stages],
  };
  expect(() => validatePublication(duplicate)).toThrow("must be unique");
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
  expect(() => validatePublication(definition)).toThrow(
    "requires a system action",
  );
});

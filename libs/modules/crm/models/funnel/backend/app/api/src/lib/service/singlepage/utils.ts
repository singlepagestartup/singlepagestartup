import type { IFunnelDefinition } from "@sps/crm/models/funnel/sdk/model";

export function validatePublication(definition: IFunnelDefinition) {
  const stageIds = new Set(definition.stages.map((stage) => stage.id));
  if (stageIds.size !== definition.stages.length) {
    throw new Error("Validation error. Funnel stage IDs must be unique");
  }
  const activeStageIds = new Set(
    definition.stages
      .filter((stage) => !stage.archived)
      .map((stage) => stage.id),
  );
  if (!activeStageIds.has(definition.initialStageId)) {
    throw new Error(
      "Validation error. The initial stage must be in the funnel",
    );
  }

  for (const stage of definition.stages) {
    if (stage.archived) {
      continue;
    }
    const actionIds = new Set<string>();
    for (const action of stage.actions) {
      if (actionIds.has(action.id)) {
        throw new Error(
          "Validation error. Action IDs must be unique within a stage",
        );
      }
      actionIds.add(action.id);
      if (Boolean(action.nextStageId) === Boolean(action.outcome)) {
        throw new Error(
          "Validation error. An action must have a destination stage or an outcome",
        );
      }
      if (action.nextStageId && !activeStageIds.has(action.nextStageId)) {
        throw new Error(
          "Validation error. An action refers to an unknown stage",
        );
      }
      if (
        action.evidence.some(
          (kind) =>
            kind === "payment" ||
            kind === "delivery" ||
            kind === "file-access" ||
            kind === "result-accepted",
        ) &&
        !action.actors.includes("system")
      ) {
        throw new Error(
          "Validation error. Commerce evidence requires a system action",
        );
      }
    }

    const waiting = stage.waiting;
    if (waiting) {
      let previousSeconds = 0;
      for (const seconds of waiting.reminderSeconds) {
        if (seconds <= previousSeconds || seconds >= waiting.deadlineSeconds) {
          throw new Error(
            "Validation error. Reminder times must increase and fall before the deadline",
          );
        }
        previousSeconds = seconds;
      }
      if (
        !stage.actions.some((action) =>
          action.evidence.includes(waiting.expectedEvent),
        )
      ) {
        throw new Error(
          "Validation error. A waiting stage must handle its expected event",
        );
      }
      if (
        waiting.silenceOutcome === "completed" &&
        !waiting.completionEvidence.length
      ) {
        throw new Error(
          "Validation error. Completion after silence requires observable evidence",
        );
      }
    }
  }
}

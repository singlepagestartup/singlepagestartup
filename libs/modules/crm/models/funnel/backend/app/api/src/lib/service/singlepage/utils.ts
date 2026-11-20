import type {
  IFunnelDefinition,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";

export function validatePublication(
  definition: IFunnelDefinition,
  kind: TFunnelKind,
) {
  if (
    definition.maintenanceSourceId &&
    (kind !== "consultation" || definition.workFunding?.payer !== "store-owner")
  ) {
    throw new Error(
      "Validation error. An index maintenance funnel requires store-owner funding",
    );
  }
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
    if (
      stage.operations?.length &&
      (!definition.workFunding || definition.maintenanceSourceId)
    ) {
      throw new Error(
        "Validation error. Paid reply operations require a funded customer workflow",
      );
    }
    if (stage.output && stage.output !== "chat") {
      if (kind !== "individual-service" || !definition.workFunding) {
        throw new Error(
          "Validation error. File output requires a funded individual-service funnel",
        );
      }
    }
    if (
      stage.resultPricing?.kind === "confirmed-cost" &&
      (kind !== "individual-service" || !definition.workFunding)
    ) {
      throw new Error(
        "Validation error. Confirmed-cost pricing requires funded individual work",
      );
    }
    const actionIds = new Set<string>();
    for (const action of stage.actions) {
      if (
        action.deliveryStage &&
        (kind !== "physical-order" || !action.evidence.includes("delivery"))
      ) {
        throw new Error(
          "Validation error. A fulfillment milestone requires physical delivery evidence",
        );
      }
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

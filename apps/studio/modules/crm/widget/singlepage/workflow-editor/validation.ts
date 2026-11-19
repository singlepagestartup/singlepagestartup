import type { WorkflowDraft, WorkflowStage } from "../../../shared/workflows";

export function stageErrors(stage: WorkflowStage) {
  const errors: string[] = [];

  if (!stage.title.trim()) errors.push("Введите название этапа.");
  if (!stage.instruction.trim()) errors.push("Запишите инструкцию.");
  if (!stage.evidence.trim())
    errors.push("Опишите достаточное доказательство.");
  if (!stage.missingData.trim())
    errors.push("Укажите действие при нехватке данных.");
  if (!stage.operations.length) errors.push("Разрешите хотя бы одну операцию.");
  if (!stage.assignee) errors.push("Выберите исполнителя.");
  if (!stage.payer) errors.push("Выберите плательщика.");
  if (stage.settlementEvent === "none")
    errors.push("Выберите событие расчёта.");

  if (stage.waitFor !== "none") {
    if (!Number.isSafeInteger(stage.waitHours) || stage.waitHours <= 0)
      errors.push("Введите срок ожидания в целых часах.");
    if (!stage.silenceOutcome) errors.push("Выберите исход при молчании.");

    const intervals = stage.reminders.trim()
      ? stage.reminders.split(",").map((value) => Number(value.trim()))
      : [];
    if (
      intervals.some(
        (value, index) =>
          !Number.isSafeInteger(value) ||
          value <= (intervals[index - 1] ?? 0) ||
          value >= stage.waitHours,
      )
    ) {
      errors.push(
        "Укажите часы напоминаний по возрастанию до истечения срока ожидания.",
      );
    }
  }

  return errors;
}

export function draftErrors(draft: WorkflowDraft) {
  const errors: string[] = [];

  if (!draft.title.trim()) errors.push("Введите название воронки.");
  if (!draft.applicability.trim())
    errors.push("Укажите, когда применять воронку.");
  if (!draft.goal.trim()) errors.push("Опишите цель воронки.");
  if (!draft.stages.some((stage) => !stage.archived))
    errors.push("Добавьте действующий этап.");

  return errors;
}

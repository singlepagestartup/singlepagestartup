import type {
  Workflow,
  WorkflowPerson,
  WorkflowStage,
} from "../../../shared/workflows";

export function stageErrors(stage: WorkflowStage, people: WorkflowPerson[]) {
  const errors: string[] = [];

  if (!stage.title.trim()) errors.push("Введите название этапа.");
  const assignee = people.find(({ id }) => id === stage.assignee);
  if (!assignee) errors.push("Выберите сотрудника.");
  if (assignee?.kind === "agent") {
    if (!stage.payer) errors.push("Выберите владельца магазина.");
    const positiveDecimal = (value: string) =>
      /^(?:0|[1-9]\d{0,17})(?:\.\d{1,12})?$/.test(value) && Number(value) > 0;
    const run = stage.maxRunAmount ?? "";
    const stageLimit = stage.maxStageAmount ?? "";
    if (
      !positiveDecimal(run) ||
      !positiveDecimal(stageLimit) ||
      Number(run) > Number(stageLimit)
    ) {
      errors.push(
        "Лимит на сообщение должен быть положительным и укладываться в лимит этапа.",
      );
    }
  }
  const pricing = stage.resultPricing;
  if (pricing?.kind === "confirmed-cost") {
    const positiveDecimal = (value: string) =>
      /^(?:0|[1-9]\d{0,17})(?:\.\d{1,12})?$/.test(value) && Number(value) > 0;
    if (!positiveDecimal(pricing.multiplier)) {
      errors.push("Введите положительный коэффициент расчёта.");
    }
    const pairs = pricing.conversions.map(
      (rate) => `${rate.fromCurrencyId}:${rate.toCurrencyId}`,
    );
    if (
      new Set(pairs).size !== pairs.length ||
      pricing.conversions.some(
        (rate) =>
          !rate.fromCurrencyId ||
          !rate.toCurrencyId ||
          rate.fromCurrencyId === rate.toCurrencyId ||
          !positiveDecimal(rate.rate) ||
          !rate.source.trim() ||
          !/(?:Z|[+-]\d\d:\d\d)$/.test(rate.observedAt) ||
          !Number.isFinite(Date.parse(rate.observedAt)),
      )
    ) {
      errors.push(
        "Для каждой пары валют укажите один положительный курс, его источник и дату с часовым поясом.",
      );
    }
  }

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

export function draftErrors(draft: Workflow) {
  const errors: string[] = [];

  if (!draft.title.trim()) errors.push("Введите название воронки.");
  if (!draft.applicability.trim())
    errors.push("Укажите, когда применять воронку.");
  if (!draft.goal.trim()) errors.push("Опишите цель воронки.");
  if (!draft.stages.some((stage) => !stage.archived))
    errors.push("Добавьте действующий этап.");

  return errors;
}

const labels: Record<string, readonly [string, string]> = {
  "in-progress": ["В работе", "In progress"],
  "awaiting-result": ["Готовим результат", "Preparing the result"],
  "awaiting-payment": ["Ожидает оплаты", "Awaiting payment"],
  paid: ["Оплачен", "Paid"],
  preparing: ["Собирается", "Preparing"],
  "in-transit": ["В пути", "In transit"],
  delivered: ["Доставлен", "Delivered"],
  new: ["Новый", "New"],
  draft: ["Готовится", "Draft"],
  open: ["Ожидает оплаты", "Awaiting payment"],
  paying: ["Ожидает оплаты", "Awaiting payment"],
  pending: ["Ожидает оплаты", "Awaiting payment"],
  approving: ["Ожидает подтверждения", "Awaiting confirmation"],
  packaging: ["Собирается", "Packaging"],
  delivering: ["В пути", "Delivering"],
  completed: ["Завершён", "Completed"],
  expired: ["Срок истёк", "Expired"],
  failed: ["Ошибка оплаты", "Payment failed"],
  requested_cancelation: ["Запрошена отмена", "Cancellation requested"],
  canceling: ["Отменяется", "Canceling"],
  canceled: ["Отменён", "Canceled"],
  uncollectible: ["Не удалось получить оплату", "Payment uncollectible"],
  void: ["Аннулирован", "Voided"],
};

const activeOrderStates = new Set([
  "new",
  "paying",
  "paid",
  "approving",
  "packaging",
  "delivering",
]);

export function orderDisplayStatus(status: string, workState?: string | null) {
  if (workState && activeOrderStates.has(status)) return workState;
  return status === "cancelled" ? "canceled" : status;
}

export function orderStatusLabel(status: string, language: string) {
  const ru = language === "ru";
  return (
    labels[status]?.[ru ? 0 : 1] ??
    (ru ? "Статус неизвестен" : "Unknown status")
  );
}

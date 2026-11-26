export function columnLayout(showItems?: boolean, quantity?: boolean) {
  if (showItems)
    return "md:grid-cols-[5.5rem_minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_1rem]";
  if (quantity) return "md:grid-cols-[6rem_1fr_1fr_1fr_1rem]";
  return "md:grid-cols-[6rem_1fr_1fr_1rem]";
}

export function OrderColumns({
  language,
  showItems,
  quantity,
}: {
  language: string;
  showItems?: boolean;
  quantity?: boolean;
}) {
  const ru = language === "ru";
  return (
    <div
      aria-hidden="true"
      className={`grid gap-x-4 px-4 text-xs font-medium text-muted-foreground max-md:[&>span:not(:first-child)]:hidden ${columnLayout(showItems, quantity)}`}
    >
      <span>{ru ? "Заказ" : "Order"}</span>
      {showItems && (
        <span>{ru ? "Товары и количество" : "Products and quantities"}</span>
      )}
      <span>{ru ? "Дата" : "Date"}</span>
      <span>{ru ? "Статус" : "Status"}</span>
      {showItems && <span>{ru ? "Стоимость" : "Total"}</span>}
      {quantity && <span>{ru ? "Количество" : "Quantity"}</span>}
    </div>
  );
}

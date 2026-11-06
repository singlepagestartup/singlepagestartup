import { useState } from "react";

export function ShopExample({ minimum = 0 }: { minimum?: number }) {
  const [mugs, setMugs] = useState(minimum ? 3 : 2);
  const [plates, setPlates] = useState(minimum ? 2 : 1);
  const total = mugs + plates;
  const remaining = Math.max(0, minimum - total);
  const [sent, setSent] = useState(false);
  const rows = [
    {
      title: "Кружка · белая · 300 мл",
      price: 1200,
      quantity: mugs,
      set: setMugs,
    },
    {
      title: "Тарелка · синяя · 20 см",
      price: 900,
      quantity: plates,
      set: setPlates,
    },
  ];
  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]">
      <figcaption className="bg-[var(--workspace-brand-foreground)] px-6 py-5 text-white">
        <span className="text-sm text-[var(--workspace-brand-accent)]">
          Учебный магазин · интерактивный пример
        </span>
        <p className="mt-1 text-2xl font-semibold">
          {minimum ? "Заказ от шести изделий" : "Корзина мастерской"}
        </p>
      </figcaption>
      <div className="space-y-5 p-6">
        {rows.map((row) => (
          <div
            key={row.title}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-brand-line)] pb-5"
          >
            <div>
              <p className="font-semibold">{row.title}</p>
              <p className="text-sm text-[var(--workspace-brand-muted)]">
                {row.price.toLocaleString("ru-RU")} ₽ / шт.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Уменьшить: ${row.title}`}
                disabled={!row.quantity}
                onClick={() => {
                  row.set(row.quantity - 1);
                  setSent(false);
                }}
                className="size-11 rounded-lg border bg-white font-semibold disabled:opacity-40"
              >
                −
              </button>
              <output className="min-w-6 text-center">{row.quantity}</output>
              <button
                type="button"
                aria-label={`Добавить: ${row.title}`}
                onClick={() => {
                  row.set(row.quantity + 1);
                  setSent(false);
                }}
                className="size-11 rounded-lg border bg-white font-semibold"
              >
                +
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap justify-between gap-2">
          <span>
            Изделий: <strong>{total}</strong>
          </span>
          <strong>
            {(mugs * 1200 + plates * 900).toLocaleString("ru-RU")} ₽ без
            доставки
          </strong>
        </div>
        <p aria-live="polite" className="rounded-xl bg-white p-4 text-base">
          {remaining
            ? `До минимального заказа осталось: ${remaining} шт.`
            : total
              ? "Можно отправить заказ на согласование наличия."
              : "Добавьте товары в корзину."}
        </p>
        <button
          type="button"
          disabled={remaining > 0 || !total}
          onClick={() => setSent(true)}
          className="min-h-12 rounded-xl bg-[var(--workspace-brand-accent)] px-6 font-semibold disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          Проверить заказ
        </button>
        <p
          role="status"
          className="text-sm text-[var(--workspace-brand-muted)]"
        >
          {sent
            ? `Пример: ${total} шт. на ${(mugs * 1200 + plates * 900).toLocaleString("ru-RU")} ₽. Следующий шаг — контакт покупателя и отправка продавцу.`
            : "Меняйте количество кнопками. Пример работает в браузере и не отправляет реальный заказ."}
        </p>
      </div>
    </figure>
  );
}

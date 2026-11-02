import { useState } from "react";
export function ServiceExample() {
  const [sent, setSent] = useState(false);
  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)]">
      <figcaption className="bg-[var(--workspace-brand-foreground)] px-6 py-4 text-sm text-white">
        Учебный пример страницы и формы обращения
      </figcaption>
      <div className="grid sm:grid-cols-2">
        <div className="bg-[var(--workspace-brand-background)] p-6">
          <p className="text-sm font-semibold uppercase tracking-widest">
            Мастерская мебели
          </p>
          <h3 className="mt-4 text-3xl font-semibold leading-tight">
            У стула разошлось соединение?
          </h3>
          <p className="mt-4 text-base leading-7">
            Пришлите фотографии повреждения. Мастер определит объём ремонта и
            согласует стоимость.
          </p>
          <img
            src="/workspace-assets/singlepage/generated/editorial-v1/furniture.png"
            alt="Мастер показывает клиентке повреждённое соединение стула"
            className="mt-6 h-auto w-full rounded-xl"
            width={1536}
            height={1024}
          />
        </div>
        <form
          className="space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <h3 className="text-xl font-semibold">Фото для оценки</h3>
          <label className="block text-sm font-medium">
            Фотография предмета
            <input
              type="file"
              accept="image/*"
              required
              className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:p-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Что повреждено
            <textarea
              required
              rows={3}
              placeholder="Например, шатается ножка стула"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Как с вами связаться
            <input
              required
              placeholder="Телефон или почта"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </label>
          <button
            className="min-h-12 rounded-xl bg-[var(--workspace-brand-accent)] px-4 text-base font-semibold"
            type="submit"
          >
            Проверить заполнение
          </button>
          <p
            role="status"
            className="text-sm text-[var(--workspace-brand-muted)]"
          >
            {sent
              ? "Поля заполнены. На рабочем сайте заявка сохраняется и передаётся мастерской."
              : "Демонстрационная форма: данные и файлы остаются в браузере, заявка не отправляется."}
          </p>
        </form>
      </div>
    </figure>
  );
}

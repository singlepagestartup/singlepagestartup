import { Component as File } from "../../../../../modules/file-storage/file";

export function KnowledgeExample({ compact = false }: { compact?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-white text-[var(--workspace-brand-foreground)]">
      <figcaption className="border-b border-[var(--workspace-brand-line)] px-6 py-4 text-sm font-semibold">
        AI Chat · пример материалов фотографа
      </figcaption>
      <div className={`grid ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <div className="space-y-4 bg-[var(--workspace-brand-background)] p-6">
          <p className="text-sm font-semibold uppercase tracking-widest">
            Материалы проекта
          </p>
          {[
            "Прайс на съёмку.pdf",
            "Условия работы.txt",
            "Описание услуги.md",
          ].map((name, index) => (
            <File
              key={name}
              variant="id-ai-chat"
              file={{
                id: `example-${index}`,
                name,
                text: "",
                size: 0,
                mimeType: "text/plain",
              }}
            />
          ))}
          <p className="text-sm leading-6">
            До 10 товаров · 3 снимка каждого · 15 000 ₽ · 3 рабочих дня после
            съёмки.
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold uppercase tracking-widest">
            Описание услуги
          </p>
          <h3
            className={`${compact ? "text-3xl" : "text-2xl"} mt-4 font-semibold leading-tight`}
          >
            Фотографии товаров для вашего каталога
          </h3>
          <p className="mt-4 text-base leading-7">
            Снимем до 10 товаров и подготовим по 3 обработанных снимка каждого
            за 15 000 ₽. Вы получите файлы JPEG с базовой ретушью через 3
            рабочих дня после съёмки.
          </p>
          <p className="mt-4 text-base leading-7">
            Чтобы обсудить съёмку, пришлите список товаров и примеры нужных
            ракурсов.
          </p>
          <p className="mt-6 text-sm text-[var(--workspace-brand-muted)]">
            {compact
              ? "Учебные условия. Пример подготовленного текста."
              : "Учебные условия. Карточки файлов используют компонент платформы; ответ подготовлен для примера."}
          </p>
        </div>
      </div>
    </figure>
  );
}

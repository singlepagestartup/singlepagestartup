import type { ReactNode } from "react";

/**
 * One line per document kind: what it decides, and what breaks when it is wrong.
 *
 * The owner reviews these pages in order without knowing the framework, so the
 * header answers the only question they have on opening one, which is whether
 * to read it. Restating the document below it, or explaining how to use it,
 * costs a line and answers nothing.
 */
const purposes: Record<string, string> = {
  brief:
    "Что известно о бизнесе со слов клиента и что ещё нужно уточнить. На эти сведения опираются последующие решения.",
  strategy:
    "Как проект достигает целей из брифа: аудитория, позиционирование, роли продуктов и продвижение.",
  brand:
    "Смысл бренда, его обещание и язык. Какие утверждения бизнес может подтвердить.",
  design:
    "Общий внешний вид продуктов: айдентика, шрифты, цвета, интерфейс, фотографии и иллюстрации.",
  sales:
    "Путь клиента этого продукта: от первого контакта до дальнейшего использования.",
  product:
    "Клиент, проблема, ценность и предложение продукта. Основа для сайта, продвижения и презентации.",
  website:
    "Что посетитель должен понять и сделать на каждой странице. Требования до начала разработки.",
  creative: "Сообщения, форматы и материалы для продвижения продукта.",
  "asset-index":
    "Загруженные и созданные файлы: происхождение, права использования и состояние проверки.",
};

export function documentPurpose(kind: string, fallback = "") {
  return { purpose: purposes[kind] ?? fallback };
}

export interface IDocumentHeaderProps {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
  titleId?: string;
  purpose?: string;
}

export function DocumentHeader({
  actions,
  eyebrow,
  title,
  titleId,
  purpose,
}: IDocumentHeaderProps) {
  return (
    <header
      data-product-header={eyebrow ? true : undefined}
      className="mb-8 w-full rounded-3xl bg-[var(--workspace-brand-primary)] p-7 text-[var(--workspace-brand-on-primary)] md:p-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-4 text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
              {eyebrow}
            </p>
          )}
          <h1
            id={titleId}
            className="text-3xl font-semibold tracking-tight md:text-5xl"
          >
            {title}
          </h1>
          {purpose && (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--workspace-brand-muted-on-primary)] md:text-base">
              {purpose}
            </p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function DocumentReviewToolbar({
  actions,
  note,
}: {
  actions?: ReactNode;
  note?: ReactNode;
}) {
  if (!actions && !note) return null;
  return (
    <div
      className="border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-5 py-4 md:px-10"
      data-document-toolbar
    >
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {actions}
        </div>
      )}
      {note && (
        <div className="mt-3 text-sm text-[var(--workspace-brand-muted)]">
          {note}
        </div>
      )}
    </div>
  );
}

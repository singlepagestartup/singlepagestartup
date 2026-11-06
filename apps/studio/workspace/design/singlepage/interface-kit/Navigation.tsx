import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { Fragment, useId, useRef, useState } from "react";
import {
  SectionTabsRoot,
  SectionTabsList,
  SectionTabsTrigger,
  SectionTabsContent,
} from "./Tabs";
import { Button, Icon, kit, Specimen } from "./primitives";

interface IPaginationControlsProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}

const navigationItems = [
  {
    id: "overview",
    label: "Обзор",
    detail: "Кратко о проекте и текущей работе.",
  },
  {
    id: "materials",
    label: "Материалы",
    detail: "Заметки, документы и изображения проекта.",
  },
  {
    id: "settings",
    label: "Настройки",
    detail: "Название проекта и настройки отображения.",
  },
];

export function CompactNavigation() {
  const navigationId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState("overview");
  const [open, setOpen] = useState(false);
  const current = navigationItems.find((item) => item.id === active)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[var(--workspace-brand-surface)] p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="stack" /> Проект
        </span>
        <Button
          ref={menuButtonRef}
          variant="secondary"
          className="sm:hidden"
          aria-expanded={open}
          aria-controls={navigationId}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "x" : "stack"} /> Меню
        </Button>
        <nav
          id={navigationId}
          aria-label="Пример навигации проекта"
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-1 sm:flex sm:w-auto sm:flex-row`}
        >
          {navigationItems.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={active === item.id ? "page" : undefined}
              className={`min-h-11 rounded-xl px-4 py-2 text-left text-sm font-medium ${kit.focus} ${active === item.id ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]" : `${kit.muted} hover:bg-[var(--workspace-brand-background)]`}`}
              onClick={() => {
                setActive(item.id);
                if (open) menuButtonRef.current?.focus();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            disabled
            className="min-h-11 cursor-not-allowed rounded-xl px-4 py-2 text-left text-sm text-[var(--workspace-brand-muted)] opacity-50"
          >
            Оплата
          </button>
        </nav>
      </header>
      <div
        className="border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5"
        aria-live="polite"
      >
        <p className="text-sm font-semibold">{current.label}</p>
        <p className={`mt-2 text-sm leading-6 ${kit.muted}`}>
          {current.detail}
        </p>
      </div>
    </div>
  );
}

export function PaginationControls({
  page,
  pageCount,
  onPageChange,
  label = "Страницы результатов",
}: IPaginationControlsProps) {
  const pages =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, index) => index)
      : [...new Set([0, page - 1, page, page + 1, pageCount - 1])]
          .filter((index) => index >= 0 && index < pageCount)
          .sort((a, b) => a - b);

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        className="px-3"
        disabled={page === 0 || pageCount === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon name="arrow-right" className="rotate-180" />
        <span className="sr-only sm:not-sr-only">Назад</span>
      </Button>
      {pages.map((pageIndex, index) => (
        <Fragment key={pageIndex}>
          {index > 0 && pageIndex - pages[index - 1] > 1 ? (
            <span aria-hidden="true" className={`px-1 text-sm ${kit.muted}`}>
              …
            </span>
          ) : null}
          <Button
            variant={page === pageIndex ? "primary" : "plain"}
            className="min-w-11 px-3"
            aria-label={`Page ${pageIndex + 1}`}
            aria-current={page === pageIndex ? "page" : undefined}
            onClick={() => onPageChange(pageIndex)}
          >
            {pageIndex + 1}
          </Button>
        </Fragment>
      ))}
      <Button
        variant="secondary"
        className="px-3"
        disabled={page >= pageCount - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <span className="sr-only sm:not-sr-only">Далее</span>
        <Icon name="arrow-right" />
      </Button>
    </nav>
  );
}

function BreadcrumbExample() {
  const [depth, setDepth] = useState(2);
  const labels = ["Workspace", "Materials", "Заметки проекта"];

  return (
    <div className={kit.card}>
      <nav aria-label="Пример пути страницы">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {labels.slice(0, depth + 1).map((label, index) => (
            <li className="flex min-w-0 items-center gap-2" key={label}>
              {index > 0 ? (
                <Icon name="arrow-right" className={kit.muted} />
              ) : null}
              {index === depth ? (
                <span aria-current="page" className="font-semibold">
                  {label}
                </span>
              ) : (
                <button
                  type="button"
                  className={`min-h-11 rounded-md underline-offset-4 hover:underline ${kit.muted} ${kit.focus}`}
                  onClick={() => setDepth(index)}
                >
                  {label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <p className={`mt-3 text-sm ${kit.muted}`} aria-live="polite">
        Просмотр {labels[depth].toLowerCase()}.
      </p>
      <Button
        variant="plain"
        className="mt-3 px-0"
        disabled={depth === 2}
        onClick={() => setDepth(2)}
      >
        Открыть заметки проекта
      </Button>
    </div>
  );
}

export function NavigationSpecimens() {
  const [page, setPage] = useState(0);
  const publicNavId = useId();

  return (
    <div className="grid min-w-0 gap-4">
      <Specimen
        id="navigation"
        title="Навигация"
        guidance={<SurfacePatternGuidance title="Work screen frame" />}
        description="Публичные ссылки называют назначение, рабочая навигация показывает текущий раздел. На узком экране компактное меню открывается под шапкой."
        states={[
          "default",
          "current",
          "клавиатурный фокус",
          "disabled",
          "компактное меню открыто / закрыто",
        ]}
        usage="Публичная навигация ведёт по настоящим адресам. Локальный пример переключает панели внутри образца; оплата недоступна. Высота цели от 44px."
        recipe="min-h-11 rounded-xl px-4 py-2 text-sm font-medium; current: bg-[var(--workspace-brand-background)]; compact: hidden sm:flex; kit.focus"
      >
        <div className="grid gap-4">
          <nav
            aria-label="Пример публичной навигации"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--workspace-brand-line)] px-4 py-3"
          >
            <span className="text-sm font-semibold">SinglePageStartup</span>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a
                href={`#${publicNavId}-intro`}
                className={`inline-flex min-h-11 items-center rounded-md underline-offset-4 hover:underline ${kit.focus}`}
              >
                Введение
              </a>
              <a
                href={`#${publicNavId}-usage`}
                className={`inline-flex min-h-11 items-center rounded-md underline-offset-4 hover:underline ${kit.focus}`}
              >
                Применение
              </a>
            </div>
          </nav>
          <div className="grid gap-3 sm:grid-cols-2">
            <p
              id={`${publicNavId}-intro`}
              className={`scroll-mt-6 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-6 ${kit.muted}`}
            >
              <strong className="text-[var(--workspace-brand-foreground)]">
                Введение.
              </strong>{" "}
              Навигация связывает страницу с разделами.
            </p>
            <p
              id={`${publicNavId}-usage`}
              className={`scroll-mt-6 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm leading-6 ${kit.muted}`}
            >
              <strong className="text-[var(--workspace-brand-foreground)]">
                Применение.
              </strong>{" "}
              Названия назначений короткие и конкретные.
            </p>
          </div>
          <CompactNavigation />
        </div>
      </Specimen>

      <Specimen
        id="tabs"
        title="Вкладки"
        description="Вкладки переключают связанные виды, сохраняя окружающую задачу."
        states={[
          "выбрано",
          "unselected",
          "hover",
          "клавиатурный фокус",
          "disabled",
        ]}
        usage="Стрелки, Home и End перемещаются по доступным вкладкам. Tab входит в активную панель. Для готовых локальных панелей подходит автоматическая активация."
        recipe="rounded-lg px-4 py-3 text-sm font-medium; data-[state=active]:bg-[var(--workspace-brand-surface)] data-[state=active]:shadow-sm; disabled:opacity-50; kit.focus"
      >
        <SectionTabsRoot defaultValue="overview">
          <SectionTabsList
            aria-label="Виды материалов"
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--workspace-brand-background)] p-1"
          >
            {[
              { value: "overview", title: "Обзор" },
              { value: "activity", title: "Действия" },
              { value: "history", title: "История", disabled: true },
            ].map((tab) => (
              <SectionTabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
              >
                {tab.title}
              </SectionTabsTrigger>
            ))}
          </SectionTabsList>
          <SectionTabsContent
            value="overview"
            className={`mt-3 rounded-xl border border-[var(--workspace-brand-line)] p-5 text-sm leading-6 ${kit.focus}`}
          >
            <p className="font-semibold">Заметки проекта</p>
            <p className={`mt-2 ${kit.muted}`}>
              Место для решений и материалов, которые вы проверяете.
            </p>
          </SectionTabsContent>
          <SectionTabsContent
            value="activity"
            className={`mt-3 rounded-xl border border-[var(--workspace-brand-line)] p-5 text-sm leading-6 ${kit.focus}`}
          >
            <p className="font-semibold">Недавние действия</p>
            <p className={`mt-2 ${kit.muted}`}>
              Заметки проекта добавлены. Для проверки нужен ваш ответ.
            </p>
          </SectionTabsContent>
        </SectionTabsRoot>
      </Specimen>

      <Specimen
        id="breadcrumbs"
        title="Путь страницы"
        description="Короткий путь ведёт к родительскому уровню. Текущая страница — простой текст."
        states={[
          "родительская страница",
          "текущая страница",
          "клавиатурный фокус",
          "только корень",
        ]}
        usage="Label the nav landmark, use an ordered list and aria-current=page on the final item. This local example opens parent levels; the reset action restores the full trail."
        recipe="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm; parent: min-h-11 underline-offset-4 hover:underline; current: font-semibold; kit.focus"
      >
        <BreadcrumbExample />
      </Specimen>

      <Specimen
        id="pagination"
        title="Пагинация"
        description="Небольшой набор страниц показывает текущую позицию и отключает недоступные направления."
        states={[
          "первая страница",
          "средняя страница",
          "последняя страница",
          "текущая страница",
          "недоступное направление",
          "клавиатурный фокус",
        ]}
        usage="Для локальной замены результатов — кнопки. Для отдельных адресуемых страниц — настоящие URL. Большие наборы показывают первую, последнюю и соседние страницы с пропусками; максимум семь номерных кнопок."
        recipe="flex flex-wrap items-center gap-2; numbered controls: min-w-11 px-3; kit.button / kit.plain / kit.secondary; aria-current=page"
      >
        <div className="grid gap-4">
          <p className={`text-sm ${kit.muted}`} aria-live="polite">
            Показаны элементы {page * 3 + 1}–{page * 3 + 3} из 9
          </p>
          <ol start={page * 3 + 1} className="grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((offset) => (
              <li
                key={page * 3 + offset}
                className="rounded-xl border border-[var(--workspace-brand-line)] p-4 text-sm"
              >
                Материал {page * 3 + offset + 1}
              </li>
            ))}
          </ol>
          <PaginationControls
            page={page}
            pageCount={3}
            onPageChange={setPage}
            label="Пример страниц материалов"
          />
        </div>
      </Specimen>
    </div>
  );
}

export default NavigationSpecimens;

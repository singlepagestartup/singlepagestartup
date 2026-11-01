import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Checkbox,
  Icon,
  Select,
  kit,
  Specimen,
  Surface,
  SquareImage,
} from "./primitives";
import { PaginationControls } from "./Navigation";

type MaterialStatus =
  | "Draft"
  | "In review"
  | "In progress"
  | "Ready"
  | "Archived";

const materialLabels: Record<string, string> = {
  Draft: "Черновик",
  "In review": "На проверке",
  "In progress": "В работе",
  Ready: "Готово",
  Archived: "В архиве",
  All: "Все",
  Document: "Документ",
  Collection: "Подборка",
};

interface IAvatarProps {
  name: string;
  src?: string;
  size?: "small" | "medium" | "large";
}

interface IMaterial {
  id: string;
  name: string;
  kind: string;
  status: MaterialStatus;
  updated: string;
}

interface IDataTableRowProps {
  item: IMaterial;
  selected: boolean;
  onSelect: (id: string) => void;
}

interface IStructuredListRowProps {
  item: IMaterial;
  onOpen: (id: string) => void;
}

const sampleMaterials: IMaterial[] = [
  {
    id: "notes",
    name: "Заметки проекта",
    kind: "Document",
    status: "In review",
    updated: "2026-10-03",
  },
  {
    id: "audience",
    name: "Описание аудитории",
    kind: "Document",
    status: "Draft",
    updated: "2026-10-01",
  },
  {
    id: "brief",
    name: "Запрос проекта",
    kind: "Document",
    status: "Ready",
    updated: "2026-09-30",
  },
  {
    id: "images",
    name: "Фотореференсы",
    kind: "Collection",
    status: "Ready",
    updated: "2026-10-02",
  },
  {
    id: "offer",
    name: "Заметки о предложении",
    kind: "Document",
    status: "Draft",
    updated: "2026-09-29",
  },
  {
    id: "outline",
    name: "Структура страницы",
    kind: "Document",
    status: "In review",
    updated: "2026-09-28",
  },
  {
    id: "archive",
    name: "Предыдущая структура",
    kind: "Document",
    status: "Archived",
    updated: "2026-09-20",
  },
];

export function StatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${status === "Ready" ? "border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]" : status === "In review" ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] ring-1 ring-inset ring-[var(--workspace-brand-line)]" : `border border-[var(--workspace-brand-line)] ${kit.muted}`}`}
    >
      {status === "Ready" ? (
        <span className="grid size-5 place-items-center rounded-full bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
          <Icon name="check" className="h-3.5 w-3.5" />
        </span>
      ) : status === "In review" ? (
        <Icon name="eye" />
      ) : null}
      {materialLabels[status] ?? status}
    </span>
  );
}

export function Avatar({ name, src, size = "medium" }: IAvatarProps) {
  const [failedSource, setFailedSource] = useState<string | undefined>();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => Array.from(word)[0])
      .join("")
      .toUpperCase() || "?";
  const sizes = {
    small: "size-10 text-xs",
    medium: "size-12 text-sm",
    large: "size-16 text-lg",
  };

  return (
    <span
      role="img"
      aria-label={name || "Без имени"}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] font-semibold text-[var(--workspace-brand-foreground)] ${sizes[size]}`}
    >
      {src && failedSource !== src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

const DataTableRow = memo(function DataTableRow({
  item,
  selected,
  onSelect,
}: IDataTableRowProps) {
  return (
    <tr
      className={`border-t border-[var(--workspace-brand-line)] ${selected ? "bg-[var(--workspace-brand-background)]" : "bg-[var(--workspace-brand-surface)]"}`}
    >
      <td className="px-1 py-2">
        <label className="mx-auto grid size-11 cursor-pointer place-items-center has-[:disabled]:cursor-not-allowed">
          <Checkbox
            aria-label={`Select ${item.name}`}
            checked={selected}
            disabled={item.status === "Archived"}
            onChange={() => onSelect(item.id)}
          />
        </label>
      </td>
      <th scope="row" className="px-4 py-3 text-left font-medium">
        {item.name}
        <span className={`mt-1 block text-xs font-normal ${kit.muted}`}>
          {materialLabels[item.kind] ?? item.kind}
        </span>
      </th>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className={`whitespace-nowrap px-4 py-3 text-xs ${kit.muted}`}>
        <time dateTime={item.updated}>{item.updated}</time>
      </td>
    </tr>
  );
});

export function DataTable() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MaterialStatus | "All">("All");
  const [sort, setSort] = useState<{
    key: "name" | "updated";
    ascending: boolean;
  }>({ key: "name", ascending: true });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageSize = 3;
  const filtered = useMemo(
    () =>
      sampleMaterials
        .filter(
          (item) =>
            (status === "All" || item.status === status) &&
            `${item.name} ${materialLabels[item.kind] ?? item.kind}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .sort(
          (a, b) =>
            a[sort.key].localeCompare(b[sort.key]) * (sort.ascending ? 1 : -1),
        ),
    [query, status, sort],
  );
  const pageCount = Math.ceil(filtered.length / pageSize);
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const selectable = visible.filter((item) => item.status !== "Archived");
  const selectedOnPage = selectable.filter((item) =>
    selected.has(item.id),
  ).length;

  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate =
        selectedOnPage > 0 && selectedOnPage < selectable.length;
  }, [selectedOnPage, selectable.length]);

  const toggleRow = useCallback((itemId: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const sortBy = (key: "name" | "updated") => {
    setSort((current) => ({
      key,
      ascending: current.key === key ? !current.ascending : true,
    }));
    setPage(0);
  };

  return (
    <div className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="grid gap-2" htmlFor={`${id}-search`}>
          <span className={kit.label}>Поиск материалов</span>
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            placeholder="Имя или тип"
            className={kit.field}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="grid gap-2" htmlFor={`${id}-status`}>
          <span className={kit.label}>Статус</span>
          <Select
            id={`${id}-status`}
            value={materialLabels[status] ?? status}
            onValueChange={(value) => {
              setStatus(value as MaterialStatus | "All");
              setPage(0);
            }}
            options={["All", "Draft", "In review", "Ready", "Archived"].map(
              (value) => ({ value, label: materialLabels[value] ?? value }),
            )}
          />
        </label>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm ${kit.muted}`} role="status">
          {filtered.length} результатов · {selected.size} выбрано на всех
          страницах
        </p>
        <Button
          variant="plain"
          className="px-3"
          disabled={selected.size === 0}
          onClick={() => setSelected(new Set())}
        >
          Снять выбор
        </Button>
      </div>
      <div
        role="region"
        aria-label="Таблица материалов, на узких экранах прокручивается по горизонтали"
        tabIndex={0}
        className={`relative overflow-x-auto rounded-xl border border-[var(--workspace-brand-line)] ${kit.focus}`}
      >
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">
            Примеры материалов. Сортировка по имени или дате. Архивные строки
            нельзя выбрать.
          </caption>
          <thead className="bg-[var(--workspace-brand-background)]">
            <tr>
              <th scope="col" className="w-14 px-1 py-1">
                <label className="mx-auto grid size-11 cursor-pointer place-items-center has-[:disabled]:cursor-not-allowed">
                  <Checkbox
                    ref={selectAllRef}
                    aria-label="Выбрать все доступные строки страницы"
                    checked={
                      selectable.length > 0 &&
                      selectedOnPage === selectable.length
                    }
                    disabled={selectable.length === 0}
                    onChange={() =>
                      setSelected((previous) => {
                        const next = new Set(previous);
                        for (const item of selectable) {
                          if (selectedOnPage === selectable.length)
                            next.delete(item.id);
                          else next.add(item.id);
                        }
                        return next;
                      })
                    }
                  />
                </label>
              </th>
              <th
                scope="col"
                aria-sort={
                  sort.key === "name"
                    ? sort.ascending
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-4 py-1 text-left font-semibold"
              >
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md ${kit.focus}`}
                  onClick={() => sortBy("name")}
                >
                  Имя{" "}
                  <Icon
                    name="arrow-down"
                    className={
                      sort.key !== "name"
                        ? "opacity-40"
                        : sort.ascending
                          ? "rotate-180"
                          : undefined
                    }
                  />
                  <span className="sr-only">, сортировать по имени</span>
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Статус
              </th>
              <th
                scope="col"
                aria-sort={
                  sort.key === "updated"
                    ? sort.ascending
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-4 py-1 text-left font-semibold"
              >
                <button
                  type="button"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md ${kit.focus}`}
                  onClick={() => sortBy("updated")}
                >
                  Обновлено{" "}
                  <Icon
                    name="arrow-down"
                    className={
                      sort.key !== "updated"
                        ? "opacity-40"
                        : sort.ascending
                          ? "rotate-180"
                          : undefined
                    }
                  />
                  <span className="sr-only">
                    , сортировать по дате обновления
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <DataTableRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleRow}
              />
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <p className="font-semibold">Материалы не найдены</p>
                  <p className={`mt-2 ${kit.muted}`}>
                    Попробуйте другое имя или очистите фильтры.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => {
                      setQuery("");
                      setStatus("All");
                      setPage(0);
                    }}
                  >
                    Очистить фильтры
                  </Button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${kit.muted}`}>
          Архивные материалы видны, но недоступны для выбора.
        </p>
        <PaginationControls
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          label="Страницы таблицы материалов"
        />
      </div>
    </div>
  );
}

const StructuredListRow = memo(function StructuredListRow({
  item,
  onOpen,
}: IStructuredListRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-[var(--workspace-brand-line)] py-4 last:border-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--workspace-brand-background)]">
        <Icon name={item.kind === "Collection" ? "folder-open" : "file-text"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className={`mt-1 text-xs ${kit.muted}`}>
          {materialLabels[item.kind] ?? item.kind} · {item.status}
        </p>
      </div>
      <Button
        variant="plain"
        disabled={item.status === "Archived"}
        aria-label={`Open ${item.name}`}
        onClick={() => onOpen(item.id)}
      >
        Открыть <Icon name="arrow-right" />
      </Button>
    </li>
  );
});

function StructuredList() {
  const [empty, setEmpty] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const openItem = useCallback((id: string) => setOpened(id), []);
  const items = [sampleMaterials[0], sampleMaterials[3], sampleMaterials[6]];

  return (
    <div className={kit.card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Сохранённые материалы</p>
        <Button
          variant="secondary"
          onClick={() => {
            setEmpty((value) => !value);
            setOpened(null);
          }}
        >
          {empty ? "Восстановить пример списка" : "Показать пустой список"}
        </Button>
      </div>
      {empty ? (
        <div className="py-8 text-center">
          <Icon
            name="folder-open"
            size={24}
            className={`mx-auto ${kit.muted}`}
          />
          <p className="mt-3 text-sm font-semibold">
            Нет сохранённых материалов
          </p>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            Добавьте первый материал в список.
          </p>
        </div>
      ) : (
        <ul className="mt-3">
          {items.map((item) => (
            <StructuredListRow key={item.id} item={item} onOpen={openItem} />
          ))}
        </ul>
      )}
      <p className={`mt-3 min-h-5 text-sm ${kit.muted}`} role="status">
        {opened
          ? `${sampleMaterials.find((item) => item.id === opened)?.name} выбран для просмотра.`
          : ""}
      </p>
    </div>
  );
}

export function DataDisplaySpecimens() {
  const progressId = useId();
  const [reviewed, setReviewed] = useState(2);
  const [showPhoto, setShowPhoto] = useState(true);

  return (
    <div className="grid min-w-0 gap-4">
      <Specimen
        id="surfaces"
        title="Поверхности и медиа"
        description="Карточки, разделители и рамки изображений задают структуру, которую контентный блок наполняет смыслом."
        states={[
          "обычная поверхность",
          "приглушённая вставка",
          "квадратное медиа",
          "длинный текст",
          "divider",
        ]}
        usage="Surface задаёт границу и фон, дочерние элементы — отступы. SquareImage использует проверенный квадрат с содержательным описанием. hr разделяет темы, border служит декору. Карточка интерактивна только с подписанной ссылкой или кнопкой."
        recipe="Surface: min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]. SquareImage: block aspect-square w-full object-cover. Body: p-5. Divider: border-[var(--workspace-brand-line)]."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
              alt="Владелец бизнеса обдумывает идею."
            />
            <figcaption className="p-5 text-sm">
              Квадратное изображение с отдельной подписью.
            </figcaption>
          </Surface>
          <Surface className="p-5">
            <h4 className="text-base font-semibold">Обзор проекта</h4>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Поверхность объединяет связанные сведения. Длинные заголовки и
              текст переносятся внутри доступной ширины.
            </p>
            <hr className="my-5 border-[var(--workspace-brand-line)]" />
            <p className="text-sm">
              Подробности могут идти после смыслового разделителя.
            </p>
            <div className="mt-5 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm">
              Приглушённая вставка подходит для дополнительного контекста.
            </div>
          </Surface>
        </div>
      </Specimen>

      <Specimen
        id="status"
        title="Статус и прогресс"
        description="Текст называет состояние. Маленькая лаймовая галочка отмечает готовность; проверка и ожидание — графит и холодный серый. Прогресс показывает известный объём или явно неопределённую задачу."
        states={[
          "draft",
          "на проверке",
          "ready",
          "archived",
          "измеримый прогресс",
          "неопределённый прогресс",
          "complete",
        ]}
        usage="Не полагайтесь только на цвет. Кнопка проверки продвигает локальный пример из пяти элементов. При неизвестном объёме остатка используйте неопределённую полосу."
        recipe="inline-flex rounded-full px-2.5 py-1 text-xs font-medium; review: bg-[var(--workspace-brand-background)] ring-1 ring-inset ring-[var(--workspace-brand-line)]; ready indicator: size-5 with a centred 14px Phosphor check, rounded-full bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]"
      >
        <div className="flex flex-wrap gap-2">
          {(["Draft", "In review", "Ready", "Archived"] as const).map(
            (status) => (
              <StatusBadge key={status} status={status} />
            ),
          )}
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className={kit.card}>
            <label
              htmlFor={progressId}
              className="flex items-center justify-between gap-3 text-sm font-medium"
            >
              <span>Проверено материалов</span>
              <span aria-live="polite">{reviewed} из 5</span>
            </label>
            <progress
              id={progressId}
              max={5}
              value={reviewed}
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--workspace-brand-background)] accent-[var(--workspace-brand-foreground)] [&::-moz-progress-bar]:bg-[var(--workspace-brand-foreground)] [&::-webkit-progress-bar]:bg-[var(--workspace-brand-background)] [&::-webkit-progress-value]:bg-[var(--workspace-brand-foreground)]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={reviewed === 5}
                onClick={() => setReviewed((count) => Math.min(5, count + 1))}
              >
                {reviewed === 5 ? "Проверка завершена" : "Проверить следующий"}
              </Button>
              <Button variant="plain" onClick={() => setReviewed(0)}>
                Сбросить
              </Button>
            </div>
          </div>
          <div className={kit.card}>
            <p className="text-sm font-medium">Проверка файлов</p>
            <div
              role="progressbar"
              aria-label="Проверка файлов"
              aria-valuetext="В работе; оставшееся время неизвестно"
              className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--workspace-brand-background)]"
            >
              <span className="block h-full w-1/3 rounded-full bg-[var(--workspace-brand-muted)] motion-safe:animate-pulse" />
            </div>
            <p className={`mt-4 text-sm leading-6 ${kit.muted}`}>
              Пример с неизвестным объёмом. Процент и срок завершения не заданы.
            </p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="avatars"
        title="Аватары"
        description="Фото или инициалы обозначают человека в компактной области. Инициалы доступны, если изображения нет или оно не загрузилось."
        states={[
          "photo",
          "запасные инициалы",
          "вариант без имени",
          "group",
          "маленький / средний / большой",
        ]}
        usage="У каждого аватара доступное имя. Декоративный повтор портрета скрыт, если имя уже указано рядом. Фото профиля обрезается пропорционально через object-cover."
        recipe="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]; sizes: size-10 / size-12 / size-16; image: h-full w-full object-cover"
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            name="Пример фотоаватара"
            size="large"
            src={
              showPhoto
                ? "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
                : undefined
            }
          />
          <Avatar name="Maya Stone" />
          <Avatar name="Alex Reed" size="small" />
          <Avatar name="" size="small" />
          <Button
            variant="secondary"
            onClick={() => setShowPhoto((value) => !value)}
          >
            {showPhoto ? "Показать инициалы" : "Показать фото"}
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ul aria-label="Примеры участников" className="flex -space-x-2">
            {["Maya Stone", "Alex Reed", "Lee Park"].map((name) => (
              <li
                key={name}
                className="rounded-full ring-2 ring-[var(--workspace-brand-surface)]"
              >
                <Avatar name={name} size="small" />
              </li>
            ))}
          </ul>
          <p className={`text-sm ${kit.muted}`}>3 участника</p>
        </div>
      </Specimen>

      <Specimen
        id="data-table"
        title="Таблица данных"
        description="Компактная таблица позволяет просматривать, фильтровать, сортировать и выбирать записи, сохраняя окружающий контекст."
        states={[
          "default",
          "filtered",
          "пустые результаты",
          "сортировка по возрастанию / убыванию",
          "строка выбрана",
          "частичный выбор страницы",
          "недоступный выбор строки",
          "paginated",
        ]}
        usage="Search and status filters combine. Select-all applies to the current page; selection persists across pages and filters. Sortable columns expose aria-sort. The table scrolls horizontally on small screens."
        recipe="table: w-full min-w-[560px] border-collapse text-sm; cells: px-4 py-3; row: border-t border-[var(--workspace-brand-line)]; selected: bg-[var(--workspace-brand-background)]; wrapper: relative overflow-x-auto"
      >
        <DataTable />
      </Specimen>

      <Specimen
        id="accordion"
        title="Раскрывающиеся разделы"
        description="Пояснения раскрываются под видимыми вопросами. Несколько ответов могут оставаться открытыми."
        states={["collapsed", "expanded", "клавиатурный фокус"]}
        usage="Нативные details и summary дают Enter/Space и состояние раскрытия без своего скрипта. Заголовок описывает содержание; интерактивные элементы находятся внутри ответа."
        recipe="details: border-b border-[var(--workspace-brand-line)] py-4 last:border-0; summary: min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold; answer: mt-3 text-sm leading-6; kit.focus"
      >
        <div className={kit.card}>
          <details
            open
            className="border-b border-[var(--workspace-brand-line)] py-4 last:border-0"
          >
            <summary
              className={`min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold ${kit.focus}`}
            >
              Что включить в заметку проекта?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Решение, его источник и следующий вопрос без ответа.
            </p>
          </details>
          <details className="border-b border-[var(--workspace-brand-line)] py-4 last:border-0">
            <summary
              className={`min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold ${kit.focus}`}
            >
              Может ли материал оставаться незавершённым?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Пока собираете данные, сохраняйте черновик. Видимый статус не даст
              принять его за проверенный материал.
            </p>
          </details>
          <details className="border-b border-[var(--workspace-brand-line)] py-4 last:border-0">
            <summary
              className={`min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold ${kit.focus}`}
            >
              Как группировать подробности?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Один вопрос на раскрытие. Несвязанным сведениям — отдельный
              раздел.
            </p>
          </details>
        </div>
      </Specimen>

      <Specimen
        id="structured-list"
        title="Структурированный список"
        description="Строка объединяет иконку, заголовок, пояснение и одно действие. Пустое состояние объясняет, что здесь появится."
        states={[
          "default",
          "выбранный просмотр",
          "недоступное действие",
          "empty",
          "восстановленный список",
        ]}
        usage="Используйте стабильные ID записей и мемоизированные строки. Архивные записи читаются, но действие недоступно. Выбор примера локальный, реальный файл не открывает и не меняет."
        recipe="row: flex flex-wrap items-center gap-3 border-b border-[var(--workspace-brand-line)] py-4 last:border-0; icon: size-11 rounded-xl bg-[var(--workspace-brand-background)]; text: min-w-0 flex-1"
      >
        <StructuredList />
      </Specimen>
    </div>
  );
}

export default DataDisplaySpecimens;

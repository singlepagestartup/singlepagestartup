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
    name: "Project notes",
    kind: "Document",
    status: "In review",
    updated: "2026-10-03",
  },
  {
    id: "audience",
    name: "Audience outline",
    kind: "Document",
    status: "Draft",
    updated: "2026-10-01",
  },
  {
    id: "brief",
    name: "Project request",
    kind: "Document",
    status: "Ready",
    updated: "2026-09-30",
  },
  {
    id: "images",
    name: "Photo references",
    kind: "Collection",
    status: "Ready",
    updated: "2026-10-02",
  },
  {
    id: "offer",
    name: "Offer notes",
    kind: "Document",
    status: "Draft",
    updated: "2026-09-29",
  },
  {
    id: "outline",
    name: "Page outline",
    kind: "Document",
    status: "In review",
    updated: "2026-09-28",
  },
  {
    id: "archive",
    name: "Previous outline",
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
      {status}
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
      aria-label={name || "Unnamed person"}
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
          {item.kind}
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
            `${item.name} ${item.kind}`
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
          <span className={kit.label}>Search materials</span>
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            placeholder="Name or type"
            className={kit.field}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="grid gap-2" htmlFor={`${id}-status`}>
          <span className={kit.label}>Status</span>
          <Select
            id={`${id}-status`}
            value={status}
            onValueChange={(value) => {
              setStatus(value as MaterialStatus | "All");
              setPage(0);
            }}
            options={["All", "Draft", "In review", "Ready", "Archived"].map(
              (value) => ({ value, label: value }),
            )}
          />
        </label>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm ${kit.muted}`} role="status">
          {filtered.length} results · {selected.size} selected across pages
        </p>
        <Button
          variant="plain"
          className="px-3"
          disabled={selected.size === 0}
          onClick={() => setSelected(new Set())}
        >
          Clear selection
        </Button>
      </div>
      <div
        role="region"
        aria-label="Materials table, scroll horizontally on small screens"
        tabIndex={0}
        className={`relative overflow-x-auto rounded-xl border border-[var(--workspace-brand-line)] ${kit.focus}`}
      >
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">
            Example materials. Sort by name or updated date. Archived rows
            cannot be selected.
          </caption>
          <thead className="bg-[var(--workspace-brand-background)]">
            <tr>
              <th scope="col" className="w-14 px-1 py-1">
                <label className="mx-auto grid size-11 cursor-pointer place-items-center has-[:disabled]:cursor-not-allowed">
                  <Checkbox
                    ref={selectAllRef}
                    aria-label="Select all available rows on this page"
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
                  Name{" "}
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
                  <span className="sr-only">, sort by name</span>
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                Status
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
                  Updated{" "}
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
                  <span className="sr-only">, sort by updated date</span>
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
                  <p className="font-semibold">No matching materials</p>
                  <p className={`mt-2 ${kit.muted}`}>
                    Try another name or clear the filters.
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
                    Clear filters
                  </Button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${kit.muted}`}>
          Archived materials remain visible and cannot be selected.
        </p>
        <PaginationControls
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          label="Material table pages"
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
          {item.kind} · {item.status}
        </p>
      </div>
      <Button
        variant="plain"
        disabled={item.status === "Archived"}
        aria-label={`Open ${item.name}`}
        onClick={() => onOpen(item.id)}
      >
        Open <Icon name="arrow-right" />
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
        <p className="text-sm font-semibold">Saved materials</p>
        <Button
          variant="secondary"
          onClick={() => {
            setEmpty((value) => !value);
            setOpened(null);
          }}
        >
          {empty ? "Restore sample list" : "Show empty list"}
        </Button>
      </div>
      {empty ? (
        <div className="py-8 text-center">
          <Icon
            name="folder-open"
            size={24}
            className={`mx-auto ${kit.muted}`}
          />
          <p className="mt-3 text-sm font-semibold">No saved materials</p>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            Add a material to give this list its first item.
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
          ? `${sampleMaterials.find((item) => item.id === opened)?.name} is selected for preview.`
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
        title="Surfaces and media"
        description="Cards, dividers and image frames provide reusable structure before a content block adds its message."
        states={[
          "default surface",
          "muted inset",
          "square media",
          "long text",
          "divider",
        ]}
        usage="Surface supplies the edge and background; its children supply spacing. SquareImage uses the reviewed square asset with a meaningful alternative. Use an hr for a thematic break and a border for decoration. A card is only interactive when it contains a named link or button."
        recipe="Surface: min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]. SquareImage: block aspect-square w-full object-cover. Body: p-5. Divider: border-[var(--workspace-brand-line)]."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
              alt="A business owner taking a moment to consider an idea."
            />
            <figcaption className="p-5 text-sm">
              A square image with a separate caption.
            </figcaption>
          </Surface>
          <Surface className="p-5">
            <h4 className="text-base font-semibold">Project overview</h4>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              A surface groups related information. Long headings and copy wrap
              naturally inside the available width.
            </p>
            <hr className="my-5 border-[var(--workspace-brand-line)]" />
            <p className="text-sm">
              Details can follow a meaningful section break.
            </p>
            <div className="mt-5 rounded-xl bg-[var(--workspace-brand-background)] p-4 text-sm">
              Use a muted inset for supporting context.
            </div>
          </Surface>
        </div>
      </Specimen>

      <Specimen
        id="status"
        title="Status and progress"
        description="Text names the state. A small lime check marks readiness inside a quiet badge; review and waiting states use graphite and cool gray. Progress reports a known total or an explicitly indeterminate task."
        states={[
          "draft",
          "in review",
          "ready",
          "archived",
          "determinate progress",
          "indeterminate progress",
          "complete",
        ]}
        usage="Do not rely on color alone. The review button advances this five-item local example. Use an indeterminate bar when the remaining work has no reliable count."
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
              <span>Materials reviewed</span>
              <span aria-live="polite">{reviewed} of 5</span>
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
                {reviewed === 5 ? "Review complete" : "Review next item"}
              </Button>
              <Button variant="plain" onClick={() => setReviewed(0)}>
                Reset
              </Button>
            </div>
          </div>
          <div className={kit.card}>
            <p className="text-sm font-medium">Checking files</p>
            <div
              role="progressbar"
              aria-label="Checking files"
              aria-valuetext="In progress; remaining time unknown"
              className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--workspace-brand-background)]"
            >
              <span className="block h-full w-1/3 rounded-full bg-[var(--workspace-brand-muted)] motion-safe:animate-pulse" />
            </div>
            <p className={`mt-4 text-sm leading-6 ${kit.muted}`}>
              Indeterminate example. No percentage or completion time is known.
            </p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="avatars"
        title="Avatars"
        description="A photo or initials identifies a person in compact spaces. Initials remain available when no image is supplied or an image fails."
        states={[
          "photo",
          "initials fallback",
          "unnamed fallback",
          "group",
          "small / medium / large",
        ]}
        usage="Every avatar has an accessible name. Decorative duplicate portraits should be hidden when the adjacent name already supplies the same information. Crop profile images proportionally with object-cover."
        recipe="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]; sizes: size-10 / size-12 / size-16; image: h-full w-full object-cover"
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            name="Photo avatar example"
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
            {showPhoto ? "Show initials fallback" : "Show photo"}
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ul aria-label="Example collaborators" className="flex -space-x-2">
            {["Maya Stone", "Alex Reed", "Lee Park"].map((name) => (
              <li
                key={name}
                className="rounded-full ring-2 ring-[var(--workspace-brand-surface)]"
              >
                <Avatar name={name} size="small" />
              </li>
            ))}
          </ul>
          <p className={`text-sm ${kit.muted}`}>3 collaborators</p>
        </div>
      </Specimen>

      <Specimen
        id="data-table"
        title="Data table"
        description="A compact table supports scanning, filtering, sorting and selecting individual records without changing the surrounding context."
        states={[
          "default",
          "filtered",
          "empty results",
          "ascending / descending sort",
          "row selected",
          "partial page selection",
          "disabled row selection",
          "paginated",
        ]}
        usage="Search and status filters combine. Select-all applies to the current page; selection persists across pages and filters. Sortable columns expose aria-sort. The table scrolls horizontally on small screens."
        recipe="table: w-full min-w-[560px] border-collapse text-sm; cells: px-4 py-3; row: border-t border-[var(--workspace-brand-line)]; selected: bg-[var(--workspace-brand-background)]; wrapper: relative overflow-x-auto"
      >
        <DataTable />
      </Specimen>

      <Specimen
        id="accordion"
        title="Accordion"
        description="Disclosures reveal supporting information while keeping their questions visible. Multiple answers may remain open."
        states={["collapsed", "expanded", "keyboard focus"]}
        usage="Native details and summary provide Enter/Space activation and expanded state without custom scripting. Keep the summary descriptive and place interactive content inside the answer."
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
              What belongs in a project note?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Write the decision, its source and the next question that needs an
              answer.
            </p>
          </details>
          <details className="border-b border-[var(--workspace-brand-line)] py-4 last:border-0">
            <summary
              className={`min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold ${kit.focus}`}
            >
              Can a material remain unfinished?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Keep a draft state while you gather information. A visible status
              prevents it from being mistaken for a reviewed item.
            </p>
          </details>
          <details className="border-b border-[var(--workspace-brand-line)] py-4 last:border-0">
            <summary
              className={`min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold ${kit.focus}`}
            >
              How should details be grouped?
            </summary>
            <p className={`mt-3 text-sm leading-6 ${kit.muted}`}>
              Keep one question in each disclosure. Give unrelated information
              its own section.
            </p>
          </details>
        </div>
      </Specimen>

      <Specimen
        id="structured-list"
        title="Structured list"
        description="Rows combine an identifying icon, a title, supporting information and one action. The empty state explains what will appear here."
        states={[
          "default",
          "selected preview",
          "unavailable action",
          "empty",
          "restored list",
        ]}
        usage="Use stable record IDs and memoized rows. Archived items remain readable while their action is disabled. The example selection is local and does not open or modify a real file."
        recipe="row: flex flex-wrap items-center gap-3 border-b border-[var(--workspace-brand-line)] py-4 last:border-0; icon: size-11 rounded-xl bg-[var(--workspace-brand-background)]; text: min-w-0 flex-1"
      >
        <StructuredList />
      </Specimen>
    </div>
  );
}

export default DataDisplaySpecimens;

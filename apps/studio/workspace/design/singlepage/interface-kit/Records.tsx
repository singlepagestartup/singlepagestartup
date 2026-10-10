import {
  memo,
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type FormEventHandler,
} from "react";
import { twMerge } from "tailwind-merge";
import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmationDialog } from "./Confirmation";
import {
  Button,
  Checkbox,
  Icon,
  Select,
  kit,
  type IconName,
} from "./primitives";

export interface IRecordField<T> {
  key: string;
  label: string;
  value: (record: T) => string;
  displayValue?: (record: T) => string;
  renderValue?: (record: T) => ReactNode;
}
export interface IRecordAction<T> {
  label: string;
  icon: IconName;
  onAction: (record: T) => void;
}
interface IRecordRowProps<T extends { id: string }> {
  record: T;
  fields: IRecordField<T>[];
  actions: IRecordAction<T>[];
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onRemove?: (record: T) => void;
  removalLabel: string;
  compactActions: boolean;
}
function RecordRowComponent<T extends { id: string }>({
  record,
  fields,
  actions,
  selected,
  onSelect,
  onRemove,
  removalLabel,
  compactActions,
}: IRecordRowProps<T>) {
  return (
    <article className="flex min-w-0 flex-wrap items-start gap-4 px-5 py-5 sm:px-6">
      {onRemove && (
        <Checkbox
          aria-label={`Select ${record.id}`}
          checked={selected}
          onChange={(event) => onSelect(record.id, event.target.checked)}
        />
      )}
      <dl className="grid min-w-0 flex-1 basis-48 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="min-w-0">
            <dt className={`text-xs ${kit.muted}`}>{field.label}</dt>
            <dd
              className={`mt-1 [overflow-wrap:anywhere] text-sm ${field.key === "adminTitle" || field.key === "title" ? "font-semibold" : ""}`}
            >
              {field.renderValue?.(record) ??
                ((field.displayValue?.(record) ?? field.value(record)) || "—")}
            </dd>
          </div>
        ))}
      </dl>
      <div className="ml-auto flex max-w-full flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            aria-label={`${action.label} ${record.id}`}
            title={action.label}
            className={compactActions ? "w-11 shrink-0 px-0" : "min-w-11 px-3"}
            onClick={() => action.onAction(record)}
          >
            <Icon name={action.icon} />
            <span
              className={compactActions ? "sr-only" : "sr-only sm:not-sr-only"}
            >
              {action.label}
            </span>
          </Button>
        ))}
        {onRemove && (
          <Button
            variant="danger"
            aria-label={`${removalLabel} ${record.id}`}
            title={removalLabel}
            className={compactActions ? "w-11 shrink-0 px-0" : "min-w-11 px-3"}
            onClick={() => onRemove(record)}
          >
            <Icon name={removalLabel === "Unlink" ? "link-break" : "trash"} />
            <span
              className={compactActions ? "sr-only" : "sr-only sm:not-sr-only"}
            >
              {removalLabel}
            </span>
          </Button>
        )}
      </div>
    </article>
  );
}
const RecordRow = memo(RecordRowComponent) as typeof RecordRowComponent;

export interface IRecordsProps<T extends { id: string }> {
  title: string;
  scope: string;
  records: T[];
  fields: IRecordField<T>[];
  searchFields?: IRecordField<T>[];
  actions: IRecordAction<T>[];
  createLabel?: string;
  onCreate?: () => void;
  onRemove?: (ids: string[]) => void;
  removalLabel?: string;
  removalDescription?: string;
  children?: ReactNode;
  emptyState?: ReactNode;
  embedded?: boolean;
  compactActions?: boolean;
}

interface IRecordEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  onCloseAutoFocus?: Dialog.DialogContentProps["onCloseAutoFocus"];
}
const RecordEditorDepth = createContext(-1);
const RecordEditorPortal = createContext<HTMLElement | null>(null);

export interface IRecordFormProps {
  children: ReactNode;
  footer: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  id?: string;
  className?: string;
}

/** The model owns its fields and submit action; the shared form owns scrolling and footer. */
export function RecordForm({
  children,
  footer,
  onSubmit,
  id,
  className,
}: IRecordFormProps) {
  const inheritedPortal = useContext(RecordEditorPortal);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  return (
    <>
      <div ref={setPortal} />
      <RecordEditorPortal.Provider value={inheritedPortal ?? portal}>
        <form
          id={id}
          onSubmit={(event) => {
            event.stopPropagation();
            onSubmit(event);
          }}
          className={twMerge("flex h-full min-h-0 flex-1 flex-col", className)}
          data-ds-record-form
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {children}
          </div>
          {footer && (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6">
              {footer}
            </footer>
          )}
        </form>
      </RecordEditorPortal.Provider>
    </>
  );
}

export function RecordEditor({
  open,
  onOpenChange,
  title,
  description,
  children,
  onCloseAutoFocus,
}: IRecordEditorProps) {
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const inheritedPortal = useContext(RecordEditorPortal);
  const depth = useContext(RecordEditorDepth) + 1;
  const returnFocus = useRef<HTMLElement | null>(null);
  const width = [
    "sm:w-4/5",
    "sm:w-[calc(80vw-2rem)]",
    "sm:w-[calc(80vw-4rem)]",
    "sm:w-[calc(80vw-6rem)]",
  ][Math.min(depth, 3)];
  return (
    <div ref={setPortal}>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal container={inheritedPortal ?? portal}>
          <Dialog.Overlay
            className={`fixed inset-0 bg-black/40 ${["z-40", "z-60", "z-80", "z-[100]"][Math.min(depth, 3)]}`}
          />
          <Dialog.Content
            onOpenAutoFocus={() => {
              returnFocus.current = document.activeElement as HTMLElement;
            }}
            onCloseAutoFocus={
              onCloseAutoFocus ??
              ((event) => {
                event.preventDefault();
                returnFocus.current?.focus();
              })
            }
            className={`fixed inset-y-0 right-0 flex h-dvh w-full min-w-0 flex-col border-l border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-xl ${width} ${["z-50", "z-70", "z-90", "z-[110]"][Math.min(depth, 3)]}`}
            data-ds-record-editor
            data-ds-panel-depth={depth}
          >
            <header className="shrink-0 border-b border-[var(--workspace-brand-line)] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {depth > 0 && (
                    <Button
                      variant="plain"
                      className="mb-3 px-0"
                      onClick={() => onOpenChange(false)}
                    >
                      <Icon name="arrow-left" />
                      Back
                    </Button>
                  )}
                  <Dialog.Title className="text-2xl font-semibold">
                    {title}
                  </Dialog.Title>
                  <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                    {description}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button
                    variant="secondary"
                    className="w-11 px-0"
                    aria-label="Close record editor"
                  >
                    <Icon name="x" />
                  </Button>
                </Dialog.Close>
              </div>
            </header>
            <RecordEditorDepth.Provider value={depth}>
              <RecordEditorPortal.Provider value={inheritedPortal ?? portal}>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  {children}
                </div>
              </RecordEditorPortal.Provider>
            </RecordEditorDepth.Provider>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** Studio projection of the shared admin-v2 controller and model-owned row fields. */
export function Records<T extends { id: string }>({
  title,
  scope,
  records,
  fields,
  searchFields = fields,
  actions,
  createLabel,
  onCreate,
  onRemove,
  removalLabel = "Delete",
  removalDescription = "Remove the selected records from this local preview?",
  children,
  emptyState,
  embedded = false,
  compactActions = embedded,
}: IRecordsProps<T>) {
  const id = useId();
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("id");
  const [pageSize, setPageSize] = useState("100");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string[]>([]);
  const searchOptions = useMemo(
    () => [
      { key: "id", label: "ID", value: (record: T) => record.id },
      ...searchFields.filter((item) => item.key !== "id"),
    ],
    [searchFields],
  );
  const activeField =
    searchOptions.find((item) => item.key === field) ?? searchOptions[0];
  const filtered = records.filter((record) =>
    activeField
      .value(record)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const activePage = Math.min(page, pages);
  const visible = filtered.slice(
    (activePage - 1) * Number(pageSize),
    activePage * Number(pageSize),
  );
  const selectedIds = selected.filter((key) =>
    records.some((record) => record.id === key),
  );
  function reset() {
    setPage(1);
    setSelected([]);
  }
  const toggle = useCallback(
    (key: string, checked: boolean) =>
      setSelected((current) =>
        checked
          ? [...new Set([...current, key])]
          : current.filter((item) => item !== key),
      ),
    [],
  );
  const removeRow = useCallback((record: T) => setRemoving([record.id]), []);
  return (
    <section
      ref={setPortal}
      tabIndex={-1}
      className={twMerge(kit.card, "min-w-0 overflow-hidden p-0")}
      aria-label={`${title} records`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <p className={`break-words text-xs ${kit.muted}`}>{scope}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            Local preview · changes reset on reload.
          </p>
        </div>
        {onCreate && createLabel && (
          <Button onClick={onCreate}>
            <Icon name="plus" />
            {createLabel}
          </Button>
        )}
      </header>
      <div
        className={twMerge(
          "grid gap-4 border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-6",
          embedded && "mx-5 mb-5 rounded-2xl border-0 p-4 sm:mx-6 sm:px-4",
        )}
      >
        <label className="grid gap-2">
          <span className={kit.label}>Search records</span>
          <span className="relative">
            <Icon
              name="magnifying-glass"
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${kit.muted}`}
            />
            <input
              type="search"
              className={`${kit.field} pl-12`}
              placeholder={`Search ${activeField.label.toLowerCase()}`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                reset();
              }}
            />
          </span>
        </label>
        <div className="grid gap-2">
          <label className={kit.label} htmlFor={`${id}-field`}>
            Search field
          </label>
          <Select
            id={`${id}-field`}
            value={field}
            onValueChange={(value) => {
              setField(value);
              reset();
            }}
            options={searchOptions.map((item) => ({
              value: item.key,
              label: item.label,
            }))}
          />
        </div>
      </div>
      {children}
      {onRemove && visible.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--workspace-brand-line)] px-5 py-3 sm:px-6">
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              ref={(element) => {
                if (element)
                  element.indeterminate =
                    visible.some((record) => selectedIds.includes(record.id)) &&
                    !visible.every((record) => selectedIds.includes(record.id));
              }}
              aria-label="Select page"
              checked={visible.every((record) =>
                selectedIds.includes(record.id),
              )}
              aria-checked={
                visible.every((record) => selectedIds.includes(record.id))
                  ? true
                  : visible.some((record) => selectedIds.includes(record.id))
                    ? "mixed"
                    : false
              }
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? visible.map((record) => record.id)
                    : [],
                )
              }
            />
            Select page
          </label>
          <Button
            variant="danger"
            disabled={!selectedIds.length}
            onClick={() => setRemoving(selectedIds)}
          >
            {removalLabel} selected
            {selectedIds.length ? ` (${selectedIds.length})` : ""}
          </Button>
        </div>
      )}
      <div className="divide-y divide-[var(--workspace-brand-line)]">
        {visible.map((record) => (
          <RecordRow
            key={record.id}
            record={record}
            fields={fields}
            actions={actions}
            selected={selectedIds.includes(record.id)}
            onSelect={toggle}
            onRemove={onRemove ? removeRow : undefined}
            removalLabel={removalLabel}
            compactActions={compactActions}
          />
        ))}
        {!visible.length && !query && emptyState ? (
          emptyState
        ) : !visible.length ? (
          <div className="p-8 text-center">
            <p className="font-semibold">No matching records</p>
            {query && (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  reset();
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : null}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--workspace-brand-line)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor={`${id}-limit`} className={`text-sm ${kit.muted}`}>
            Rows per page
          </label>
          <Select
            id={`${id}-limit`}
            className="w-24"
            value={pageSize}
            onValueChange={(value) => {
              setPageSize(value);
              reset();
            }}
            options={["2", "5", "10", "25", "50", "100"].map((value) => ({
              value,
              label: value,
            }))}
          />
          <p className={`text-sm ${kit.muted}`} aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "record" : "records"} ·
            Page {activePage} of {pages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={activePage === 1}
            onClick={() => {
              setPage(activePage - 1);
              setSelected([]);
            }}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={activePage === pages}
            onClick={() => {
              setPage(activePage + 1);
              setSelected([]);
            }}
          >
            Next
          </Button>
        </div>
      </footer>
      <ConfirmationDialog
        open={removing.length > 0}
        onOpenChange={(open) => {
          if (!open) setRemoving([]);
        }}
        title={`${removalLabel} ${removing.length === 1 ? "record" : `${removing.length} records`}?`}
        description={`${removalDescription} Selected: ${removing.join(", ")}.`}
        confirmLabel={removalLabel}
        portalContainer={portal}
        onConfirm={() => {
          onRemove?.(removing);
          setRemoving([]);
          setSelected([]);
        }}
      />
    </section>
  );
}

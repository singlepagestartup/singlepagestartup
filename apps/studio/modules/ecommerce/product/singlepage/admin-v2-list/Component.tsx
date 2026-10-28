import type { IComponentProps, IProductAdminListProps } from "./interface";
export type { IProductAdminListProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  type ReactNode,
  useId,
  useState as useStatePresentation,
  useMemo as useMemoPresentation,
  useCallback as useCallbackPresentation,
  forwardRef,
  useState as useStatePresentation2,
  type InputHTMLAttributes,
  memo,
  useState as useStatePresentation3,
  useRef as useRefPresentation,
  useContext,
  createContext,
  useRef as useRefPresentation2,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import { EcommerceProductAdminV2Form } from "../admin-v2-form/Component";
import { studioProducts, type IStudioProduct } from "../../shared";
import { Component as Attribute } from "../../../attribute/index";
interface IRecordEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  onCloseAutoFocus?: Dialog.DialogContentProps["onCloseAutoFocus"];
}
function RecordEditor({
  open,
  onOpenChange,
  title,
  description,
  children,
  onCloseAutoFocus,
}: IRecordEditorProps) {
  const [portal, setPortal] = useStatePresentation<HTMLElement | null>(null);
  const inheritedPortal = useContext(RecordEditorPortal);
  const depth = useContext(RecordEditorDepth) + 1;
  const returnFocus = useRefPresentation2<HTMLElement | null>(null);
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
            className={`fixed inset-y-0 right-0 flex h-dvh w-full min-w-0 flex-col border-l border-border bg-card font-default text-foreground shadow-xl ${width} ${["z-50", "z-70", "z-90", "z-[110]"][Math.min(depth, 3)]}`}
            data-ds-record-editor
            data-ds-panel-depth={depth}
          >
            <header className="shrink-0 border-b border-border p-5 sm:p-6">
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
interface IConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  portalContainer?: HTMLElement | null;
}
function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  portalContainer,
}: IConfirmationDialogProps) {
  const [portal, setPortal] = useStatePresentation3<HTMLElement | null>(null);
  const cancel = useRefPresentation<HTMLButtonElement>(null);
  const returnFocus = useRefPresentation<HTMLElement | null>(null);
  return (
    <div ref={setPortal}>
      <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialog.Portal container={portalContainer ?? portal}>
          <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
          <AlertDialog.Content
            className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 font-default text-foreground shadow-xl"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current = document.activeElement as HTMLElement;
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocus.current?.isConnected) returnFocus.current.focus();
              else portalContainer?.focus();
            }}
          >
            <AlertDialog.Title className="text-xl font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              className={`mt-3 text-sm leading-6 ${kit.muted}`}
            >
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button ref={cancel} variant="secondary">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
interface IRecordRowProps<
  T extends {
    id: string;
  },
> {
  record: T;
  fields: IRecordField<T>[];
  actions: IRecordAction<T>[];
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onRemove?: (record: T) => void;
  removalLabel: string;
  compactActions: boolean;
}
function RecordRowComponent<
  T extends {
    id: string;
  },
>({
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
interface ICheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}
interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
}
type IconName = keyof typeof IconGlyphs;
interface IRecordAction<T> {
  label: string;
  icon: IconName;
  onAction: (record: T) => void;
}
interface IRecordField<T> {
  key: string;
  label: string;
  value: (record: T) => string;
  displayValue?: (record: T) => string;
  renderValue?: (record: T) => ReactNode;
}
interface IRecordsProps<
  T extends {
    id: string;
  },
> {
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
/** Studio projection of the shared admin-v2 controller and model-owned row fields. */
export function Records<
  T extends {
    id: string;
  },
>({
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
  const [portal, setPortal] = useStatePresentation<HTMLElement | null>(null);
  const [query, setQuery] = useStatePresentation("");
  const [field, setField] = useStatePresentation("id");
  const [pageSize, setPageSize] = useStatePresentation("100");
  const [page, setPage] = useStatePresentation(1);
  const [selected, setSelected] = useStatePresentation<string[]>([]);
  const [removing, setRemoving] = useStatePresentation<string[]>([]);
  const searchOptions = useMemoPresentation(
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
  const toggle = useCallbackPresentation(
    (key: string, checked: boolean) =>
      setSelected((current) =>
        checked
          ? [...new Set([...current, key])]
          : current.filter((item) => item !== key),
      ),
    [],
  );
  const removeRow = useCallbackPresentation(
    (record: T) => setRemoving([record.id]),
    [],
  );
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
          "grid gap-4 border-y border-border bg-muted p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-6",
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
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
      <div className="divide-y divide-border">
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
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-5 sm:p-6">
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
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function EcommerceProductAdminV2List({
  variant = "admin-v2-list",
  initialProduct,
}: IComponentProps = {}) {
  const [products, setProducts] = useState(studioProducts);
  const [editing, setEditing] = useState<IStudioProduct | null>(
    initialProduct ?? null,
  );
  const [preview, setPreview] = useState<IStudioProduct | null>(null);
  const [status, setStatus] = useState("");
  const changeProducts = useCallback(
    (next: IStudioProduct[]) => setProducts(next),
    [],
  );
  const returnFocus = useRef<HTMLElement | null>(null);
  const edit = useCallback((product: IStudioProduct) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setEditing({ ...product });
  }, []);
  const show = useCallback((product: IStudioProduct) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setPreview(product);
  }, []);
  const remove = useCallback((ids: string[]) => {
    setProducts((current) => current.filter((item) => !ids.includes(item.id)));
    setStatus("Selected records removed locally.");
  }, []);
  const actions = useMemo(
    () => [
      { label: "Preview", icon: "eye" as const, onAction: show },
      { label: "Edit", icon: "pencil-simple" as const, onAction: edit },
    ],
    [show, edit],
  );
  return (
    <section
      className="min-w-0"
      data-ds-block="ecommerce.product.admin-v2-list"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={variant}
    >
      <Records
        title="Products"
        scope="ecommerce / product"
        records={products}
        fields={fields}
        actions={actions}
        createLabel="Add product"
        onRemove={remove}
        onCreate={() => {
          returnFocus.current = document.activeElement as HTMLElement;
          setEditing({
            id: "",
            adminTitle: "",
            title: {},
            shortDescription: {},
            description: {},
            slug: "",
            type: "one_off",
            variant: "default",
          });
        }}
      />
      <p role="status" className={`px-5 pb-5 text-sm ${kit.muted}`}>
        {status}
      </p>
      <RecordEditor
        open={Boolean(editing || preview)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setPreview(null);
          }
        }}
        title={
          editing
            ? editing.id
              ? "Edit product"
              : "New product"
            : "Product preview"
        }
        description="Example data stays in this preview and resets when it reloads."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {editing ? (
          <EcommerceProductAdminV2Form
            key={editing.id || "new"}
            product={editing}
            embedded
            attributes={<Attribute variant="admin-v2-table" />}
            onSave={(product) => {
              const saved = {
                ...product,
                id: product.id || `product_${crypto.randomUUID()}`,
              };
              setProducts((current) =>
                product.id
                  ? current.map((item) =>
                      item.id === product.id ? saved : item,
                    )
                  : [saved, ...current],
              );
              setEditing(null);
              setStatus("Product saved locally.");
            }}
          />
        ) : preview ? (
          <div className="p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{preview.title.en}</h3>
            <p className={`mt-3 ${kit.muted}`}>{preview.description.en}</p>
            <p className={`mt-4 break-all text-xs ${kit.muted}`}>
              {preview.id} · {preview.slug}
            </p>
          </div>
        ) : null}
      </RecordEditor>
    </section>
  );
}
const RecordEditorDepth = createContext(-1);
const RecordEditorPortal = createContext<HTMLElement | null>(null);
const RecordRow = memo(RecordRowComponent) as typeof RecordRowComponent;
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border bg-card text-foreground checked:border-transparent checked:bg-primary indeterminate:border-transparent indeterminate:bg-primary disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
};
const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center has-[:disabled]:opacity-50">
      <input
        ref={ref}
        type="checkbox"
        className={twMergePresentation(kit.checkbox, kit.focus, className)}
        {...props}
      />
      <Icon
        name="check"
        className="pointer-events-none absolute h-3.5 w-3.5 text-foreground opacity-0 peer-checked:opacity-100 peer-indeterminate:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute hidden h-0.5 w-2.5 rounded-full bg-default peer-indeterminate:block"
      />
    </span>
  );
});
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-foreground/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-muted-foreground",
  content:
    "z-[60] max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-card font-default text-foreground shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};
// shadcn Select composition, themed with module tokens and Phosphor icons.
// https://ui.shadcn.com/docs/components/radix/select
export const Select = forwardRef<HTMLButtonElement, ISelectProps>(
  function Select(
    {
      id,
      className,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const [projection, setProjection] = useStatePresentation2("singlepage");
    const [editorDepth, setEditorDepth] = useStatePresentation2(0);
    return (
      <div
        ref={(node) => {
          if (node) {
            setProjection(
              node
                .closest("[data-sps-theme]")
                ?.getAttribute("data-sps-theme") ?? "singlepage",
            );
            setEditorDepth(
              Number(
                node
                  .closest("[data-ds-panel-depth]")
                  ?.getAttribute("data-ds-panel-depth") ?? 0,
              ),
            );
          }
        }}
        className="min-w-0"
      >
        <SelectPrimitive.Root
          {...props}
          onValueChange={(value) => {
            // Radix's hidden form select can emit an empty value while newly
            // created options register. Empty values are placeholders, not options.
            if (value) props.onValueChange?.(value);
          }}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={twMergePresentation(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {/* Keep fixed positioning outside CSS containers while retaining the project theme. */}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-sps-theme={projection}
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={twMergePresentation(
                picker.content,
                ["z-60", "z-80", "z-[100]", "z-[120]"][
                  Math.min(editorDepth, 3)
                ],
              )}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" className="rotate-180" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={picker.item}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Icon name="check" className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  },
);
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const fields: IRecordField<IStudioProduct>[] = [
  {
    key: "adminTitle",
    label: "Admin title",
    value: (record) => record.adminTitle,
  },
  {
    key: "title",
    label: "Title",
    value: (record) => Object.values(record.title).join(" "),
    displayValue: (record) =>
      record.title.en ?? Object.values(record.title)[0] ?? "",
  },
  { key: "slug", label: "Slug", value: (record) => record.slug },
  { key: "id", label: "ID", value: (record) => record.id },
  { key: "type", label: "Type", value: (record) => record.type },
  { key: "variant", label: "Variant", value: (record) => record.variant },
];

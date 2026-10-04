import { useId } from "react";
import { Button, Icon, kit } from "./primitives";
import { sectionChoiceClass, sectionIndicatorClass } from "./Tabs";

export interface ICollectionCategory {
  slug: string;
  label: string;
  count?: number;
}
interface ICategoryChoiceProps extends ICollectionCategory {
  active: boolean;
  onSelect?: (slug: string) => void;
}
export function CategoryChoice({
  slug,
  label,
  count,
  active,
  onSelect,
}: ICategoryChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect?.(slug)}
      className={`${sectionChoiceClass} ${active ? "bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]" : "text-[var(--workspace-brand-muted)] hover:text-[var(--workspace-brand-foreground)]"}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs ${kit.muted}`}>{count}</span>
      )}
      {active && <span aria-hidden="true" className={sectionIndicatorClass} />}
    </button>
  );
}
interface ICollectionToolbarProps {
  categories: ICollectionCategory[];
  category: string;
  onCategoryChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
}
export function CollectionToolbar({
  categories,
  category,
  onCategoryChange,
  query,
  onQueryChange,
  searchLabel,
}: ICollectionToolbarProps) {
  const id = useId();
  return (
    <div className="mb-6 grid gap-3 rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-1 rounded-xl bg-[var(--workspace-brand-background)] p-1"
      >
        {categories.map((item) => (
          <CategoryChoice
            key={item.slug}
            {...item}
            active={category === item.slug}
            onSelect={onCategoryChange}
          />
        ))}
      </div>
      <label htmlFor={id} className="relative">
        <span className="sr-only">{searchLabel}</span>
        <Icon
          name="magnifying-glass"
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${kit.muted}`}
        />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchLabel}
          className={`${kit.field} pl-12`}
        />
      </label>
    </div>
  );
}
interface ICollectionPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}
export function CollectionPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ICollectionPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label="Collection pages"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--workspace-brand-line)] pt-5"
    >
      <p className={`text-sm ${kit.muted}`} aria-live="polite">
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : "0 results"}{" "}
        · Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="caret-left" />
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon name="caret-right" />
        </Button>
      </div>
    </nav>
  );
}

import type { IComponentProps, CategoryButtonDefaultProps } from "./interface";
export type { CategoryButtonDefaultProps } from "./interface";
interface ICollectionCategory {
  slug: string;
  label: string;
  count?: number;
}
interface ICategoryChoiceProps extends ICollectionCategory {
  active: boolean;
  onSelect?: (slug: string) => void;
}
function CategoryChoice({
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
      className={`${sectionChoiceClass} ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs ${kit.muted}`}>{count}</span>
      )}
      {active && <span aria-hidden="true" className={sectionIndicatorClass} />}
    </button>
  );
}

export function CategoryButtonDefault(props?: IComponentProps) {
  const { slug, label, count, isActive, onSelect } = {
    ...defaultCategoryButtonDefaultProps,
    ...props,
  };
  return (
    <div
      data-ds-block="blog.category.button-default"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="category"
      data-variant={props?.variant ?? "button-default"}
    >
      <CategoryChoice
        slug={slug}
        label={label}
        count={count}
        active={isActive}
        onSelect={onSelect}
      />
    </div>
  );
}
const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary text-primary-foreground";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  muted: "text-muted-foreground",
  focus: focus,
};
const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
export const defaultCategoryButtonDefaultProps = {
  slug: "all",
  label: "All Posts",
  count: 6,
  isActive: true,
};

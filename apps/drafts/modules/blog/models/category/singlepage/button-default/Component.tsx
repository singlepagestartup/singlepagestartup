export const defaultCategoryButtonDefaultProps = {
  slug: "all",
  label: "All Posts",
  count: 6,
  isActive: true,
};

export type CategoryButtonDefaultProps =
  typeof defaultCategoryButtonDefaultProps;

export function CategoryButtonDefault(
  props?: Partial<CategoryButtonDefaultProps>,
) {
  const { slug, label, count, isActive } = {
    ...defaultCategoryButtonDefaultProps,
    ...props,
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      data-category-slug={slug}
      data-ds-block="blog.category.button-default"
      data-ds-layer="singlepage"
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ${
        isActive
          ? "border-slate-300 bg-white text-slate-900"
          : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700"
      }`}
    >
      {label}
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 text-[10px] text-slate-500">
        {count}
      </span>
    </button>
  );
}

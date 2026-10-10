import { CategoryChoice } from "../../../../../workspace/design/singlepage/interface-kit/Collections";
export const defaultCategoryButtonDefaultProps = {
  slug: "all",
  label: "All Posts",
  count: 6,
  isActive: true,
};

export type CategoryButtonDefaultProps =
  typeof defaultCategoryButtonDefaultProps & {
    onSelect?: (slug: string) => void;
  };

export function CategoryButtonDefault(
  props?: Partial<CategoryButtonDefaultProps>,
) {
  const { slug, label, count, isActive, onSelect } = {
    ...defaultCategoryButtonDefaultProps,
    ...props,
  };

  return (
    <div
      data-ds-block="blog.category.button-default"
      data-ds-layer="singlepage"
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

import type { IComponentPropsExtended } from "./interface";

export function Component({
  data,
  language,
  variant,
}: IComponentPropsExtended) {
  const label =
    data.title?.[language] || data.title?.en || data.title?.ru || data.name;
  return (
    <span
      data-module="ecommerce"
      data-model="product"
      data-id={data.id}
      data-variant={variant}
      className="min-w-0 break-words"
    >
      {label}
    </span>
  );
}

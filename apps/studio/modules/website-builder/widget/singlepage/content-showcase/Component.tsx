import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component({
  id,
  eyebrow,
  title,
  description,
  selectorLabel,
  previewLabel,
  items,
}: IComponentProps) {
  return (
    <ClientComponent
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      selectorLabel={selectorLabel}
      previewLabel={previewLabel}
      items={items}
    />
  );
}

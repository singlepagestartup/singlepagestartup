import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component({
  id,
  title,
  description,
  selected,
  controls,
  recordId,
  onSelect,
}: IComponentProps) {
  return (
    <ClientComponent
      id={id}
      title={title}
      description={description}
      selected={selected}
      controls={controls}
      recordId={recordId}
      onSelect={onSelect}
    />
  );
}

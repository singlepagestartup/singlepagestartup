import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentProps } from "./interface";

export function Component({
  value,
  language,
  onChange,
  onValidityChange,
}: IComponentProps) {
  return (
    <ClientComponent
      value={value}
      language={language}
      onChange={onChange}
      onValidityChange={onValidityChange}
    />
  );
}

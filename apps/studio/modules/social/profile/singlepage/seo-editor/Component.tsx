import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentProps } from "./interface";
export function Component({
  variant,
  metadata,
  language,
  onChange,
}: IComponentProps) {
  return (
    <div data-module="social" data-model="profile" data-variant={variant}>
      <ClientComponent
        variant={variant}
        metadata={metadata}
        language={language}
        onChange={onChange}
      />
    </div>
  );
}

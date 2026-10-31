import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentProps } from "./interface";
export function Component({ metadata, language, onChange }: IComponentProps) {
  return (
    <ClientComponent
      metadata={metadata}
      language={language}
      onChange={onChange}
    />
  );
}

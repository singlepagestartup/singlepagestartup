import { useState } from "react";
import { Component as MetadataEditor } from "../../../../shared/metadata-editor";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const [value, setValue] = useState(props.metadata || {});
  return (
    <MetadataEditor
      value={value}
      language={props.language}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ChildComponent
      variant={props.variant}
      isServer={props.isServer}
      data={props.data}
      language={props.language}
      className={props.className}
      fallback={props.fallback}
      file={props.file}
    />
  );
}
